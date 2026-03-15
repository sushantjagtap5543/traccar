import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class TraccarService {
  private baseUrl: string;
  private auth: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('TRACCAR_URL') || 'http://localhost:8082/api';
    const username = this.configService.get<string>('TRACCAR_USER') || 'admin';
    const password = this.configService.get<string>('TRACCAR_PASSWORD') || 'admin';
    this.auth = Buffer.from(`${username}:${password}`).toString('base64');
  }

  async createDevice(name: string, uniqueId: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/devices`,
        { name, uniqueId },
        {
          headers: {
            Authorization: `Basic ${this.auth}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Traccar createDevice error:', error.response?.data || error.message);
      throw new HttpException(
        error.response?.data || 'Failed to create device in Traccar',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendCommand(deviceId: number, type: string, attributes: any = {}): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/commands/send`,
        { deviceId, type, attributes },
        {
          headers: {
            Authorization: `Basic ${this.auth}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Traccar sendCommand error:', error.response?.data || error.message);
      throw new HttpException(
        error.response?.data || 'Failed to send command to Traccar',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getLatestPositions(deviceIds: number[]): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      deviceIds.forEach(id => params.append('deviceId', id.toString()));
      
      const response = await axios.get(`${this.baseUrl}/positions?${params.toString()}`, {
        headers: {
          Authorization: `Basic ${this.auth}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Traccar getLatestPositions error:', error.response?.data || error.message);
      return [];
    }
  }

  async getTripReport(deviceId: number, from: string, to: string): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/reports/trips`, {
        params: { deviceId, from, to },
        headers: { Authorization: `Basic ${this.auth}` },
      });
      return response.data;
    } catch (error) {
      console.error('Traccar getTripReport error:', error.response?.data || error.message);
      return [];
    }
  }

  async getStopReport(deviceId: number, from: string, to: string): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/reports/stops`, {
        params: { deviceId, from, to },
        headers: { Authorization: `Basic ${this.auth}` },
      });
      return response.data;
    } catch (error) {
      console.error('Traccar getStopReport error:', error.response?.data || error.message);
      return [];
    }
  }

  async getSummaryReport(deviceId: number, from: string, to: string): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/reports/summary`, {
        params: { deviceId, from, to },
        headers: { Authorization: `Basic ${this.auth}` },
      });
      return response.data;
    } catch (error) {
      console.error('Traccar getSummaryReport error:', error.response?.data || error.message);
      return [];
    }
  }
}
