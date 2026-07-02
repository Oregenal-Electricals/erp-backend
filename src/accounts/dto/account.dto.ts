import { IsString, IsOptional, IsNumber, IsBoolean, IsIn } from 'class-validator';

const TYPES = ['ASSET','LIABILITY','EQUITY','INCOME','EXPENSE'];
const SUBTYPES = ['BANK','CASH','DEBTOR','CREDITOR','GST','STOCK','FIXED_ASSET','REVENUE','COGS','OPEX','OTHER'];

export class CreateAccountDto {
  @IsString() accountCode: string;
  @IsString() accountName: string;
  @IsString() @IsIn(TYPES) accountType: string;
  @IsOptional() @IsString() @IsIn(SUBTYPES) accountSubType?: string;
  @IsOptional() @IsString() parentId?: string;
  @IsOptional() @IsNumber() openingBalance?: number;
  @IsOptional() @IsString() description?: string;
}

export class UpdateAccountDto {
  @IsOptional() @IsString() accountName?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
