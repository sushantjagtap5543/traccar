import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../services/users.service';
import { ClientsService } from '../services/clients.service';
import { User } from '../database/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private otpAttempts = new Map<string, { count: number, lastAttempt: number }>();

  constructor(
    private usersService: UsersService,
    private clientsService: ClientsService,
    private jwtService: JwtService,
  ) {}

  async register(mobile: string): Promise<{ message: string }> {
    const existingUser = await this.usersService.findOneByMobile(mobile);
    if (existingUser && existingUser.isOtpVerified) {
      throw new BadRequestException('Mobile number already registered and verified');
    }

    // Secure OTP generation
    const otpCode = crypto.randomInt(100000, 999999).toString();
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
        role: 'user', // Default role
      });
    }

    // Brute-force protection reset on new OTP request
    this.otpAttempts.delete(mobile);

    // TODO: Integrate with SMS Gateway (e.g., Twilio, Msg91)
    console.log(`[AUTH] OTP for ${mobile}: ${otpCode}`);

    return { message: 'OTP sent successfully. Please verify to continue.' };
  }

  async verifyOtp(mobile: string, code: string): Promise<{ accessToken: string }> {
    // Brute-force protection check
    const attempts = this.otpAttempts.get(mobile) || { count: 0, lastAttempt: 0 };
    if (attempts.count >= 5 && Date.now() - attempts.lastAttempt < 30 * 60 * 1000) {
      throw new UnauthorizedException('Too many attempts. Please try again in 30 minutes.');
    }

    const user = await this.usersService.findOneByMobile(mobile);
    if (!user || user.otpCode !== code || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      attempts.count++;
      attempts.lastAttempt = Date.now();
      this.otpAttempts.set(mobile, attempts);
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    await this.usersService.update(user.id, {
      isOtpVerified: true,
      otpCode: null,
      otpExpiresAt: null,
    });

    this.otpAttempts.delete(mobile);

    const payload = { sub: user.id, mobile: user.mobile, role: user.role, clientId: user.clientId };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async completeProfile(userId: string, profileData: { name: string; email: string; company: string; address: string; password?: string }): Promise<User> {
    const user = await this.usersService.findOneById(userId);
    if (!user) throw new BadRequestException('User not found');
    if (!user.isOtpVerified) throw new UnauthorizedException('OTP verification required');

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
    const user = await this.usersService.findOneByMobile(mobile);
    if (!user || !user.isOtpVerified) {
      throw new UnauthorizedException('User not found or not verified');
    }

    if (password && user.password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }
    } else if (user.password) {
      throw new BadRequestException('Password required');
    } else {
      // If user has no password yet (registered but profile not complete), force OTP
      throw new BadRequestException('Profile incomplete. Please use OTP login.');
    }

    const payload = { sub: user.id, mobile: user.mobile, role: user.role, clientId: user.clientId };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
