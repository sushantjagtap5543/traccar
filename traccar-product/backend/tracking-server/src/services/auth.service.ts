import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from './users.service';
import { ClientsService } from './clients.service';
import { User } from '../database/entities/user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private clientsService: ClientsService,
    private jwtService: JwtService,
  ) {}

  async register(mobile: string): Promise<{ message: string }> {
    // We allow requesting OTP even for verified users to support re-verification or password reset
    const existingUser = await this.usersService.findOneByMobile(mobile);

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (existingUser) {
      await this.usersService.update(existingUser.id, {
        otpCode,
        otpExpiresAt,
      });
    } else {
      await this.usersService.create({
        mobile,
        otpCode,
        otpExpiresAt,
      });
    }

    // TODO: Send OTP via free SMS/SMTP gateway
    console.log(`OTP for ${mobile}: ${otpCode}`);

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(mobile: string, code: string): Promise<{ accessToken: string }> {
    const user = await this.usersService.findOneByMobile(mobile);
    if (!user || user.otpCode !== code || user.otpExpiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    await this.usersService.update(user.id, {
      isOtpVerified: true,
      otpCode: null,
      otpExpiresAt: null,
    });

    const payload = { sub: user.id, mobile: user.mobile, role: user.role, clientId: user.clientId };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async completeProfile(userId: string, profileData: { name: string; email: string; company: string; address: string; password?: string }): Promise<User> {
    const user = await this.usersService.findOneById(userId);
    if (!user) throw new BadRequestException('User not found');

    if (profileData.email) {
      const existingUserWithEmail = await this.usersService.findOneByEmail(profileData.email);
      if (existingUserWithEmail && existingUserWithEmail.id !== userId) {
        throw new BadRequestException('Email address is already registered to another account');
      }
    }

    if (!profileData.name || profileData.name.length < 2) {
      throw new BadRequestException('Please provide a valid full name');
    }

    const hashedPassword = profileData.password ? await bcrypt.hash(profileData.password, 10) : undefined;
    
    let clientId = user.clientId;
    if (!clientId && profileData.company) {
      const client = await this.clientsService.create(profileData.company, profileData.email);
      clientId = client.id;
    }

    return this.usersService.update(userId, {
      ...profileData,
      password: hashedPassword,
      clientId,
    });
  }

  async login(mobile: string, password?: string): Promise<{ accessToken: string }> {
    if (!password) {
      throw new BadRequestException('Password is required for secure login');
    }

    const user = await this.usersService.findOneByMobile(mobile);
    if (!user) {
      throw new UnauthorizedException('Terminal ID not recognized');
    }

    if (!user.isOtpVerified) {
      throw new UnauthorizedException('Terminal not verified. Please complete registration.');
    }

    if (!user.password) {
      throw new UnauthorizedException('Access key not set. Please use OTP to verify and set your password.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid Access Protocol (Invalid Password)');
    }

    const payload = { sub: user.id, mobile: user.mobile, role: user.role, clientId: user.clientId };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
