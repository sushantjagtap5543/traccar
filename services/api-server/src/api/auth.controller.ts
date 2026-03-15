import { Controller, Post, Body, UseGuards, Req, Put, Get } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Request OTP for registration' })
  async register(@Body('phone') phone: string) {
    return this.authService.register(phone);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify OTP and get access token' })
  async verify(@Body('phone') phone: string, @Body('code') code: string) {
    return this.authService.verifyOtp(phone, code);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete user profile' })
  async completeProfile(@Req() req, @Body() profileData: any) {
    return this.authService.completeProfile(req.user.userId, profileData);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with phone and password' })
  async login(@Body('phone') phone: string, @Body('password') password?: string) {
    return this.authService.login(phone, password);
  }
}
