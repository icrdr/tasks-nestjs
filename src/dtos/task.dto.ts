import { IsString, IsOptional, IsBooleanString, IsNumber } from 'class-validator';

export class CreateTaskDTO {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description: string;
}

export class CreateSubTaskDTO extends CreateTaskDTO {
  @IsNumber()
  @IsOptional()
  userId?: number;

  @IsBooleanString()
  @IsOptional()
  isMandatory?: string;
}

export class GetTasksDTO {
  @IsNumber()
  @IsOptional()
  perPage?: number;

  @IsNumber()
  @IsOptional()
  page?: number;
}

export class SubmitRequestDTO {
  @IsString()
  @IsOptional()
  content?: string;
}

export class RespondRequestDTO {
  @IsBooleanString()
  isConfirmed: string;

  @IsString()
  @IsOptional()
  content?: string;
}
