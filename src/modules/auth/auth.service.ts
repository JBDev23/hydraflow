import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../../prisma/prisma';
import { getJwtSecret } from '../../lib/jwt';
import { DEFAULT_PREFERENCES, normalizePreferences } from '../../lib/preferences';
import { DomainError } from '../common/domain-error';

const DEFAULT_NOTIFICATIONS = {
  enabled: true,
  frequency: 'smart',
  sound: 'drop',
};

const TOKEN_EXPIRATION = '30d';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const isTestLoginAllowed = () =>
  process.env.NODE_ENV !== 'production' || process.env.ALLOW_TEST_LOGIN === 'true';

export type SocialLoginInput = {
  token?: string;
  provider?: string;
  manualEmail?: string;
  manualName?: string;
  deviceLanguage?: string;
};

export class AuthService {
  async socialLogin(input: SocialLoginInput) {
    const { token, provider, manualEmail, manualName, deviceLanguage } = input;

    let email = '';
    let name = '';
    let providerId = '';

    if (provider === 'google') {
      if (!token) {
        throw new DomainError('TOKEN_REQUIRED', 'Token required for Google login', 400);
      }

      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: token,
          audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        if (!payload?.email) throw new Error('No email in Google Token');

        email = payload.email;
        name = manualName || payload.name || 'Usuario Google';
        providerId = payload.sub;
      } catch (error) {
        console.error('Google Verify Error:', error);
        throw new DomainError('INVALID_GOOGLE_TOKEN', 'Invalid Google Token', 401);
      }
    } else if (provider === 'test') {
      if (!isTestLoginAllowed()) {
        throw new DomainError('TEST_LOGIN_DISABLED', 'Test login is disabled in production', 403);
      }
      if (!manualEmail) {
        throw new DomainError('EMAIL_REQUIRED', 'manualEmail is required for test login', 400);
      }
      email = manualEmail;
      name = manualName || 'Test User';
      providerId = 'test_user';
    } else {
      throw new DomainError('PROVIDER_UNSUPPORTED', 'Provider not supported', 400);
    }

    const userLang = deviceLanguage || 'es';
    const preferences = normalizePreferences(DEFAULT_PREFERENCES, userLang);

    const user = await prisma.user.upsert({
      where: { email },
      update: { name: name || undefined },
      create: {
        email,
        name,
        provider: provider!,
        providerId,
        profile: { create: { dailyGoal: 2000, activityLevel: 'sedentary' } },
        settings: {
          create: {
            notifications: DEFAULT_NOTIFICATIONS,
            preferences: preferences as object,
          },
        },
        gameStats: {
          create: { level: 1, currentXp: 0, progress: 0, dropsBalance: 10, skinsCount: 1 },
        },
        items: { create: { itemId: 'sunGlasses', isEquipped: false } },
      },
      include: {
        profile: true,
        settings: true,
        gameStats: true,
        items: true,
        achievements: true,
      },
    });

    const sessionToken = jwt.sign(
      { userId: user.id, email: user.email },
      getJwtSecret(),
      { expiresIn: TOKEN_EXPIRATION }
    );

    if (user.settings?.preferences) {
      (user.settings as { preferences: unknown }).preferences = normalizePreferences(
        user.settings.preferences as Record<string, unknown>
      );
    }

    return { token: sessionToken, user };
  }
}

export const authService = new AuthService();
