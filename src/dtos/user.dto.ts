import { IsString, IsNumberString, IsOptional, IsNumber } from 'class-validator';

export interface me {
  id: number;
  username: string;
  perms: string[];
}

export class loginDTO {
  @IsString()
  username: string;

  @IsString()
  password: string;
}

export class CreateUserDTO {
  @IsString()
  username: string;

  @IsString()
  password: string;
}

export class GetUsersDTO {
  @IsNumber()
  @IsOptional()
  perPage?: number;

  @IsNumber()
  @IsOptional()
  page?: number;
}
