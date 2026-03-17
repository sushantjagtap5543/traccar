import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from './users.service';
import { WhatsAppService } from './whatsapp.service';
import { User } from '../database/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private whatsappService: WhatsAppService,
  ) {}

  async requestOTP(mobile: string): Promise<{ success: boolean; message: string }> {
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const user = await this.usersService.findOneByMobile(mobile);
    if (!user) {
      await this.usersService.create({
        mobile,
        otpCode: otp,
        otpExpiresAt: expiresAt,
        isOtpVerified: false,
      });
    } else {
      await this.usersService.update(user.id, {
        otpCode: otp,
        otpExpiresAt: expiresAt,
        isOtpVerified: false,
      });
    }

    await this.whatsappService.sendOTP(mobile, otp);

    return { success: true, message: 'OTP sent successfully' };
  }

  async verifyOTP(mobile: string, otp: string): Promise<{ success: boolean; message: string }> {
    const user = await this.usersService.findOneByMobile(mobile);
    if (!user || user.otpCode !== otp || new Date() > user.otpExpiresAt) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.usersService.update(user.id, {
      isOtpVerified: true,
    });

    return { success: true, message: 'OTP verified successfully' };
  }

  async register(data: { name: string; email: string; mobile: string; password?: string }): Promise<{ message: string; user: User }> {
    const user = await this.usersService.findOneByMobile(data.mobile);
    if (!user || !user.isOtpVerified) {
      throw new BadRequestException('Mobile number not verified');
    }

    const existingUserByEmail = await this.usersService.findOneByEmail(data.email);
    if (existingUserByEmail && existingUserByEmail.id !== user.id) {
      throw new BadRequestException('Email already registered');
    }

    const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : undefined;

    const updatedUser = await this.usersService.update(user.id, {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: 'CLIENT',
    });

    return { 
      message: 'Registration successful',
      user: updatedUser
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

  async loginByMobile(mobile: string, password?: string): Promise<{ accessToken: string; user: any }> {
    const user = await this.usersService.findOneByMobile(mobile);
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

    const payload = { sub: user.id, mobile: user.mobile, role: user.role };
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
