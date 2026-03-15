import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../database/entities/client.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
  ) {}

  async create(name: string, email?: string) {
    const client = this.clientsRepository.create({ name, email });
    return this.clientsRepository.save(client);
  }

  async findOne(id: string) {
    return this.clientsRepository.findOne({ where: { id }, relations: ['users', 'devices'] });
  }

  async findAll() {
    return this.clientsRepository.find();
  }
}
