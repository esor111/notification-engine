import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { ProcessedMessageEntity } from './entities/processed-message.entity';

@Injectable()
export class ProcessedMessagesService {
  constructor(
    @InjectRepository(ProcessedMessageEntity)
    private readonly processedMessagesRepository: Repository<ProcessedMessageEntity>,
  ) {}

  async processOnce(
    consumerName: string,
    messageId: string,
    handler: () => Promise<void>,
  ): Promise<boolean> {
    try {
      await this.processedMessagesRepository.insert({
        consumerName,
        messageId,
      });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as { driverError?: { code?: string } }).driverError?.code === '23505'
      ) {
        return false;
      }

      throw error;
    }

    await handler();
    return true;
  }
}
