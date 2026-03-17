import { Controller, Post, Body, UseGuards, Req, Put, Get } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  @ApiOperation({ summary: 'Request a WhatsApp OTP' })
  async requestOTP(@Body('whatsapp_number') mobile: string) {
    return this.authService.requestOTP(mobile);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify a WhatsApp OTP' })
  async verifyOTP(@Body('whatsapp_number') mobile: string, @Body('otp') otp: string) {
    return this.authService.verifyOTP(mobile, otp);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() registrationData: any) {
    return this.authService.register(registrationData);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body('email') email: string, @Body('password') password?: string) {
    return this.authService.login(email, password);
  }

  @Post('login-mobile')
  @ApiOperation({ summary: 'Login with WhatsApp mobile number and password' })
  async loginMobile(@Body('whatsapp_number') mobile: string, @Body('password') password?: string) {
    return this.authService.loginByMobile(mobile, password);
  }
}
