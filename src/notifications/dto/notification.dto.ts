import { IsString, IsOptional, IsIn, IsArray } from 'class-validator';

export class CreateNotificationDto {
  @IsString() userId: string;
  @IsString() type: string;
  @IsString() title: string;
  @IsString() message: string;
  @IsOptional() @IsString() referenceType?: string;
  @IsOptional() @IsString() referenceId?: string;
  @IsOptional() @IsString() referenceNumber?: string;
  @IsOptional() @IsString() @IsIn(['LOW','MEDIUM','HIGH','URGENT']) priority?: string;
}

export class MarkReadDto {
  @IsOptional() @IsArray() ids?: string[];
}
