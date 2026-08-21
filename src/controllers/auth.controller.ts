import { Request, Response } from 'express';
import { authService } from '../modules/auth/auth.service';
import { DomainError } from '../modules/common/domain-error';

export const socialLogin = async (req: Request, res: Response) => {
  try {
    const result = await authService.socialLogin(req.body);
    return res.json({
      success: true,
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    if (error instanceof DomainError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Login Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
