import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(private configService: ConfigService) {}

  async sendOTP(mobile: string, otp: string): Promise<any> {
    const whatsappToken = this.configService.get<string>('WHATSAPP_TOKEN');
    const phoneNumberId = this.configService.get<string>('PHONE_NUMBER_ID');
    const templateName = this.configService.get<string>('WHATSAPP_OTP_TEMPLATE') || 'otp_verification';

    if (!whatsappToken || !phoneNumberId) {
      this.logger.warn('WhatsApp credentials missing. Logging OTP to console for development:');
      this.logger.log(`[DEV] OTP for ${mobile}: ${otp}`);
      return { success: true, devMode: true, otp };
    }

    try {
      const response = await axios.post(
        `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: mobile,
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: 'en_US',
            },
            components: [
              {
                type: 'body',
                parameters: [
                  {
                    type: 'text',
                    text: otp,
                  },
                ],
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${whatsappToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error('Error sending WhatsApp OTP:', error.response?.data || error.message);
      throw new Error('Failed to send OTP via WhatsApp');
    }
  }
}
