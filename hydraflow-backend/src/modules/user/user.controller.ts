import { Body, Controller, Delete, Get, HttpException, HttpStatus, Put } from '@nestjs/common';
import { TzOffset } from '../common/tz-offset.decorator';
import { UserId } from '../common/user-id.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  async getProfile(@UserId() userId: string, @TzOffset() tzOffset: number) {
    const user = await this.userService.getProfile(userId, tzOffset);
    return { success: true, user };
  }

  @Put('profile')
  async updateProfile(@UserId() userId: string, @Body() body: UpdateProfileDto) {
    try {
      console.log(`Actualizando perfil para: ${userId}`);
      const updatedUser = await this.userService.updateProfile(userId, body);
      console.log(`Perfil actualizado correctamente.`);
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Error CRÍTICO en updateProfile:', error);
      throw new HttpException(
        { error: 'Failed to update profile', details: String(error) },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('account')
  async deleteAccount(@UserId() userId: string) {
    try {
      await this.userService.deleteAccount(userId);
      return { success: true, message: 'Cuenta eliminada correctamente' };
    } catch (error) {
      console.error('Delete Account Error:', error);
      throw new HttpException(
        { error: 'No se pudo eliminar la cuenta' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
