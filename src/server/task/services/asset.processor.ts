import { Process, Processor } from '@nestjs/bull';
import { DoneCallback, Job } from 'bull';
import { AssetService } from './asset.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Inject } from '@nestjs/common';

@Processor('asset')
export class AssetProcessor {
  constructor(
    private assetService: AssetService,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
  ) {}

  @Process('generatePreview')
  handleCreatePreview(job: Job, done: DoneCallback) {
    this.logger.info(`[Queue] 'generatePreview' on asset ${job.data.assetId} added`);
    this.assetService.generatePreview(job.data.assetId);
    done();
    this.logger.info(`[Queue] 'generatePreview' on asset ${job.data.assetId} done`);
  }
}
