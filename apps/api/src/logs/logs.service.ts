import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Log } from '../entities/log.entity';

@Injectable()
export class LogsService {
  constructor(@InjectRepository(Log) private logRepo: Repository<Log>) {}

  async record(actorEmail: string, action: string, target?: string) {
    const log = this.logRepo.create({ actorEmail, action, target });
    return this.logRepo.save(log);
  }

  async findAll() {
    return this.logRepo.find({ order: { createdAt: 'DESC' } });
  }
}
