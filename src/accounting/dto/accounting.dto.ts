import { IsString, IsOptional, IsNumber, IsBoolean, IsIn, Min } from 'class-validator';

const TYPES = ['ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE'];
const NATURES = ['DEBIT','CREDIT'];

export class CreateGroupDto {
  @IsString() code: string;
  @IsString() name: string;
  @IsString() @IsIn(TYPES) type: string;
  @IsString() @IsIn(NATURES) nature: string;
  @IsOptional() @IsString() parentGroupId?: string;
  @IsOptional() @IsString() description?: string;
}

export class CreateAccountDto {
  @IsString() code: string;
  @IsString() name: string;
  @IsString() groupId: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @Min(0) openingBalance?: number;
  @IsOptional() @IsString() @IsIn(['DEBIT','CREDIT']) openingBalanceType?: string;
  @IsOptional() @IsBoolean() isBankAccount?: boolean;
  @IsOptional() @IsBoolean() isCashAccount?: boolean;
  @IsOptional() @IsBoolean() gstApplicable?: boolean;
  @IsOptional() @IsNumber() @Min(0) taxRate?: number;
  @IsOptional() @IsString() bankName?: string;
  @IsOptional() @IsString() bankAccountNumber?: string;
  @IsOptional() @IsString() bankIfscCode?: string;
}
