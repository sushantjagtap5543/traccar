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
    // Seed test devices and ADMIN for GeoSurePath
    try {
      await (this.authService as any).usersService.usersRepository.query(
        `INSERT INTO approved_devices (imei, model) VALUES ('869727079043558', 'GPS-Unit-Pro') ON CONFLICT DO NOTHING`
      );
      
      // Seed Admin User
      const adminHashedPassword = await require('bcryptjs').hash('admin', 10);
      await (this.authService as any).usersService.usersRepository.query(
        `INSERT INTO users (id, name, email, mobile, password, role, "isOtpVerified") 
         VALUES ('00000000-0000-0000-0000-000000000000', 'GeoSure-Admin', 'admin@admin.com', '0000000000', '${adminHashedPassword}', 'ADMIN', true)
         ON CONFLICT (email) DO NOTHING`
      );
    } catch (e) {
        console.error('Seeding error:', e);
    }
    
    // Map frontend fields to backend expected fields
    const mappedData = {
      name: registrationData.full_name,
      email: registrationData.email,
      mobile: registrationData.whatsapp_number,
      password: registrationData.password
    };
    
    return this.authService.register(mappedData);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email or WhatsApp mobile' })
  async login(@Body() loginData: any) {
    if (loginData.whatsapp_number) {
      return this.authService.loginByMobile(loginData.whatsapp_number, loginData.password);
    }
    return this.authService.login(loginData.email, loginData.password);
  }

  @Post('login-mobile')
  @ApiOperation({ summary: 'Login with WhatsApp mobile number and password' })
  async loginMobile(@Body('whatsapp_number') mobile: string, @Body('password') password?: string) {
    return this.authService.loginByMobile(mobile, password);
  }

  @Post('reset-password/request')
  @ApiOperation({ summary: 'Request a password reset OTP' })
  async requestPasswordReset(@Body('whatsapp_number') mobile: string) {
    return this.authService.requestPasswordReset(mobile);
  }

  @Post('reset-password/confirm')
  @ApiOperation({ summary: 'Reset password with OTP' })
  async resetPasswordConfirm(
    @Body('whatsapp_number') mobile: string, 
    @Body('otp') otp: string, 
    @Body('password') password: string
  ) {
    return this.authService.resetPassword(mobile, otp, password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@Req() req: any) {
    return this.authService.getAccount(req.user.userId);
  }
}
