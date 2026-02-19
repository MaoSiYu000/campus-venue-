import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    try {
      return await this.authService.login(dto.role, dto.account, dto.password);
    } catch (err: any) {
      if (err?.status === 401) throw err;
      console.error('[Login Error]', err?.message || err);
      throw err;
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'venue_admin', 'system_admin')
  async getProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.getProfile(user.role as 'user' | 'venue_admin' | 'system_admin', user.id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'venue_admin', 'system_admin')
  async updateProfile(@CurrentUser() user: CurrentUserPayload, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(user.role as 'user' | 'venue_admin' | 'system_admin', user.id, dto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'venue_admin', 'system_admin')
  async changePassword(@CurrentUser() user: CurrentUserPayload, @Body() dto: ChangePasswordDto) {
    if (user.role === 'user') return this.authService.changePasswordUser(user.id, dto);
    if (user.role === 'venue_admin') return this.authService.changePasswordVenueAdmin(user.id, dto);
    return this.authService.changePasswordSystemAdmin(user.id, dto);
  }
}
