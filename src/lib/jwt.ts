/**
 * JWT secret: never use a weak/default value in production.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  const isProd = process.env.NODE_ENV === 'production';

  if (!secret || secret === 'default_secret_change_me') {
    if (isProd) {
      throw new Error(
        'JWT_SECRET must be set to a strong value in production (not the default placeholder).'
      );
    }
    console.warn(
      '⚠️  JWT_SECRET missing or insecure — using a development-only secret. Do not deploy like this.'
    );
    return 'dev_only_insecure_secret_change_me';
  }

  return secret;
}
