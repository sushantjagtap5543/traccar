import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Geofence } from '../database/entities/geofence.entity';

@Injectable()
export class GeofencesService {
  constructor(
    @InjectRepository(Geofence)
    private geofenceRepository: Repository<Geofence>,
  ) {}

  async create(clientId: string, data: any) {
    const geofence = this.geofenceRepository.create({ ...data, clientId });
    return this.geofenceRepository.save(geofence);
  }

  async findAll(clientId: string) {
    return this.geofenceRepository.find({ 
      where: { clientId },
      relations: ['devices']
    });
  }

  async findOne(id: string, clientId: string) {
    const geofence = await this.geofenceRepository.findOne({ 
      where: { id, clientId },
      relations: ['devices']
    });
    if (!geofence) throw new NotFoundException('Geofence not found');
    return geofence;
  }

  async remove(id: string, clientId: string) {
    const geofence = await this.findOne(id, clientId);
    await this.geofenceRepository.remove(geofence);
  }

  // Logic to check geofences for a location
  async checkPoint(clientId: string, deviceId: string, lat: number, lng: number) {
    const geofences = await this.geofenceRepository.find({
      where: { clientId },
      relations: ['devices']
    });

    const results = [];

    for (const gf of geofences) {
      const isAssigned = gf.devices.some(d => d.id === deviceId);
      if (!isAssigned && gf.devices.length > 0) continue;

      const isInside = this.isPointInArea(lat, lng, gf.area);
      results.push({ geofence: gf, isInside });
    }

    return results;
  }

  private isPointInArea(lat: number, lng: number, area: any): boolean {
    if (area.type === 'Circle') {
      const [centerLng, centerLat] = area.center;
      const distance = this.getDistance(lat, lng, centerLat, centerLng);
      return distance <= area.radius;
    }
    // Polygon check would go here
    return false;
  }

  private getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
