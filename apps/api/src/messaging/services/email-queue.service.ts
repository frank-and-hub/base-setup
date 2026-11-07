import { Injectable, Logger } from '@nestjs/common';
import { ValkeyService } from '../../cache/valkey.service';

export interface EmailJobPayload {
  message_uuid: string;
  user_uuid: string;
  retry_count: number;
  max_retries: number;
}

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);
  private readonly queueKey = 'queue:messaging:emails';
  private readonly processingKey = 'queue:messaging:emails:processing';
  private readonly deadLetterKey = 'queue:messaging:emails:dlq';

  constructor(private readonly valkeyService: ValkeyService) {}

  async enqueueEmailJob(messageUuid: string, userUuid: string): Promise<void> {
    const job: EmailJobPayload = {
      message_uuid: messageUuid,
      user_uuid: userUuid,
      retry_count: 0,
      max_retries: 3,
    };

    try {
      const redis = this.valkeyService.getClient();
      await redis.lpush(this.queueKey, JSON.stringify(job));
      this.logger.log(`Enqueued email job for message ${messageUuid}`);
    } catch (err: any) {
      this.logger.error(`Failed to enqueue email job: ${err.message}`, err.stack);
      throw err;
    }
  }

  async popJob(): Promise<EmailJobPayload | null> {
    try {
      const redis = this.valkeyService.getClient();
      // Atomically pop from queue and move to processing queue
      const raw = await redis.rpoplpush(this.queueKey, this.processingKey);
      if (!raw) return null;
      return JSON.parse(raw) as EmailJobPayload;
    } catch (err: any) {
      this.logger.error(`Failed to pop email job from queue: ${err.message}`);
      return null;
    }
  }

  async completeJob(job: EmailJobPayload): Promise<void> {
    try {
      const redis = this.valkeyService.getClient();
      await redis.lrem(this.processingKey, 1, JSON.stringify(job));
    } catch (err: any) {
      this.logger.error(`Failed to complete email job: ${err.message}`);
    }
  }

  async retryOrDlqJob(job: EmailJobPayload, error: string): Promise<void> {
    try {
      const redis = this.valkeyService.getClient();
      // Remove from processing
      await redis.lrem(this.processingKey, 1, JSON.stringify(job));

      if (job.retry_count < job.max_retries) {
        job.retry_count += 1;
        // Exponential delay before re-enqueuing or push back to list
        this.logger.warn(
          `Retrying job for message ${job.message_uuid} (attempt ${job.retry_count}/${job.max_retries})`,
        );
        await redis.lpush(this.queueKey, JSON.stringify(job));
      } else {
        this.logger.error(
          `Job for message ${job.message_uuid} exceeded max retries. Moving to DLQ. Error: ${error}`,
        );
        await redis.lpush(
          this.deadLetterKey,
          JSON.stringify({ ...job, failed_at: new Date().toISOString(), last_error: error }),
        );
      }
    } catch (err: any) {
      this.logger.error(`Failed to retry/DLQ email job: ${err.message}`);
    }
  }

  async getQueueStats(): Promise<{ waiting: number; processing: number; dlq: number }> {
    try {
      const redis = this.valkeyService.getClient();
      const waiting = await redis.llen(this.queueKey);
      const processing = await redis.llen(this.processingKey);
      const dlq = await redis.llen(this.deadLetterKey);
      return { waiting, processing, dlq };
    } catch {
      return { waiting: 0, processing: 0, dlq: 0 };
    }
  }
}
