import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from '../database/entities/system-setting.entity';

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(
    @InjectRepository(SystemSetting)
    private settingsRepository: Repository<SystemSetting>,
  ) {}

  async onModuleInit() {
    const defaultSettings = [
      { key: 'platformName', value: 'GeoSurePath', category: 'branding' },
      { key: 'primaryLogo', value: '/logo.png', category: 'branding' },
      { key: 'supportWhatsApp', value: '910000000000', category: 'support' },
      { key: 'razorpayPublicKey', value: 'rzp_test_...', category: 'api' },
      { key: 'engineCutEnabled', value: 'true', category: 'tactical' },
    ];

    for (const setting of defaultSettings) {
      const existing = await this.settingsRepository.findOne({ where: { key: setting.key } });
      if (!existing) {
        await this.settingsRepository.save(this.settingsRepository.create(setting));
      }
    }
  }

  async getAllByType(category?: string) {
    if (category) return this.settingsRepository.find({ where: { category } });
    return this.settingsRepository.find();
  }

  async set(key: string, value: string, category: string = 'general') {
    let setting = await this.settingsRepository.findOne({ where: { key } });
    if (setting) {
      setting.value = value;
      setting.category = category;
    } else {
      setting = this.settingsRepository.create({ key, value, category });
    }
    return this.settingsRepository.save(setting);
  }

  async get(key: string): Promise<string | null> {
    const res = await this.settingsRepository.findOne({ where: { key } });
    return res ? res.value : null;
  }
}
