import { IsString, IsOptional, IsNumber, IsDateString, IsIn, Min } from 'class-validator';

export class CreateDeliveryConfirmationDto {
  @IsString() dispatchId: string;
  @IsOptional() @IsDateString() deliveryDate?: string;
  @IsString() receiverName: string;
  @IsOptional() @IsString() receiverPhone?: string;
  @IsOptional() @IsString() podNumber?: string;
  @IsOptional() @IsString() @IsIn(['GOOD','DAMAGED','PARTIAL']) condition?: string;
  @IsOptional() @IsNumber() @Min(0) shortageQty?: number;
  @IsOptional() @IsString() damageNotes?: string;
  @IsOptional() @IsString() remarks?: string;
}
