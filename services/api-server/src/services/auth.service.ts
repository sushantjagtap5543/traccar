import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from './users.service';
import { User } from '../database/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private otpAttempts = new Map<string, { count: number, lastAttempt: number }>();

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(data: { name: string; email: string; mobile: string; password?: string }): Promise<{ message: string; user: User }> {
    const existingUser = await this.usersService.findOneByEmail(data.email);
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const existingMobile = await this.usersService.findOneByMobile(data.mobile);
    if (existingMobile) {
      throw new BadRequestException('Mobile number already registered');
    }

    const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : undefined;

    const user = await this.usersService.create({
      name: data.name,
      email: data.email,
      mobile: data.mobile,
      password: hashedPassword,
      role: 'CLIENT',
      isOtpVerified: true, // Auto-verify for now as per clean auth flow request
    });

    return { 
      message: 'Registration successful',
      user
    };
  }

  async login(email: string, password?: string): Promise<{ accessToken: string; user: any }> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (password && user.password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }
    } else {
      throw new BadRequestException('Password required');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role
      }
    };
  }
}
