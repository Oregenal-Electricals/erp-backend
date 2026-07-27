import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class GiveTransferDto {
  @IsString() fromWorkOrderId: string;
  @IsString() toWorkOrderId: string;
  @IsOptional() @IsNumber() @Min(0.0001) qty?: number;
  @IsOptional() @IsString() remarks?: string;
}
