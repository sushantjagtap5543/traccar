import { Controller, Post, Body, UseGuards, Req, Put, Get } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}
