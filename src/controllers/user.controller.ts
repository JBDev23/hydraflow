import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { userService } from '../modules/user/user.service';
import { getTzOffsetFromRequest } from '../lib/dayRange';
import { DomainError } from '../modules/common/domain-error';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await userService.getProfile(req.userId!, getTzOffsetFromRequest(req));
    res.json({ success: true, user });
  } catch (error) {
    if (error instanceof DomainError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Get Profile Error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    console.log(`Actualizando perfil para: ${req.userId}`);
    const updatedUser = await userService.updateProfile(req.userId!, req.body);
    console.log(`Perfil actualizado correctamente.`);
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error CRÍTICO en updateProfile:', error);
    res.status(500).json({ error: 'Failed to update profile', details: String(error) });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    await userService.deleteAccount(req.userId!);
    return res.json({ success: true, message: 'Cuenta eliminada correctamente' });
  } catch (error) {
    console.error('Delete Account Error:', error);
    return res.status(500).json({ error: 'No se pudo eliminar la cuenta' });
  }
};

export const exportUserData = async (req: AuthRequest, res: Response) => {
  try {
    const logs = await userService.exportUserData(req.userId!);
    return res.json({ success: true, logs });
  } catch (error) {
    console.error('Export Data Error:', error);
    return res.status(500).json({ error: 'No se pudo exportar los datos' });
  }
};
