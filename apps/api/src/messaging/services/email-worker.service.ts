import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EmailQueueService } from './email-queue.service';
import { EmailSendingService } from './email-sending.service';

@Injectable()
export class EmailWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailWorkerService.name);
  private isRunning = false;
  private workerTimeout: NodeJS.Timeout | null = null;

  constructor(
    private readonly queueService: EmailQueueService,
    private readonly sendingService: EmailSendingService,
  ) {}

  onModuleInit() {
    this.startWorker();
  }

  onModuleDestroy() {
    this.stopWorker();
  }

  private startWorker() {
    this.isRunning = true;
    this.logger.log('Email background queue worker started');
    this.processLoop();
  }

  private stopWorker() {
    this.isRunning = false;
    if (this.workerTimeout) {
      clearTimeout(this.workerTimeout);
      this.workerTimeout = null;
    }
    this.logger.log('Email background queue worker stopped');
  }

  private async processLoop() {
    if (!this.isRunning) return;

    try {
      const job = await this.queueService.popJob();
      if (job) {
        this.logger.log(`Processing queued email job for message ${job.message_uuid}`);
        try {
          const result = await this.sendingService.dispatchEmail(job.message_uuid, job.user_uuid);
          if (result.success) {
            await this.queueService.completeJob(job);
            this.logger.log(`Queued email job ${job.message_uuid} sent successfully`);
          } else {
            await this.queueService.retryOrDlqJob(job, result.error || 'Dispatch failure');
          }
        } catch (err: any) {
          await this.queueService.retryOrDlqJob(job, err.message || 'Execution exception');
        }
      }
    } catch (err: any) {
      this.logger.error(`Error in queue processing loop: ${err.message}`);
    }

    // Schedule next polling tick: 1.5 seconds if active, 3 seconds if idle
    if (this.isRunning) {
      this.workerTimeout = setTimeout(() => this.processLoop(), 2000);
    }
  }
}
