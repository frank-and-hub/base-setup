import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ErrorLogDocument = ErrorLog & Document;

@Schema({ collection: 'application_error_logs', timestamps: true })
export class ErrorLog {
  @Prop({ required: true, unique: true, index: true })
  error_log_uuid: string;

  @Prop({ required: true, default: Date.now, index: true })
  timestamp: Date;

  @Prop({ required: true })
  error_type: string;

  @Prop({ required: true })
  message: string;

  @Prop()
  stack?: string;

  @Prop({ default: 'API' })
  module: string;

  @Prop({ default: 'development' })
  environment: string;

  @Prop({ required: true, index: true })
  correlation_id: string;

  @Prop({ default: 500 })
  status_code: number;

  @Prop({ type: Object })
  request_metadata?: {
    method?: string;
    url?: string;
    ip?: string;
    user_agent?: string;
    user_uuid?: string;
  };
}

export const ErrorLogSchema = SchemaFactory.createForClass(ErrorLog);
ErrorLogSchema.index({ timestamp: -1 });
ErrorLogSchema.index({ correlation_id: 1 });
ErrorLogSchema.index({ status_code: 1 });

