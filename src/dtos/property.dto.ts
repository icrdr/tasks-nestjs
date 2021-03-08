import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Exclude, Expose, Transform } from 'class-transformer';
import { ListDTO, ListRes } from './misc.dto';
import { PropertyForm, PropertyType } from '../server/common/common.entity';
import { Property } from '../server/task/entities/property.entity';

export class GetPropertiesDTO extends ListDTO {
  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

  @IsOptional()
  @IsEnum(PropertyForm)
  form?: PropertyForm;
}

export class ChangePropertyDTO {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

  @IsOptional()
  @IsEnum(PropertyForm)
  form?: PropertyForm;
}

export class AddPropertyDTO {
  @IsString()
  name: string;

  @IsEnum(PropertyType)
  type: PropertyType;

  @IsOptional()
  @IsEnum(PropertyForm)
  form?: PropertyForm;
}

@Exclude()
export class PropertyRes {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  form: PropertyForm;

  @Expose()
  type: PropertyType;

  constructor(partial: Partial<PropertyRes>) {
    Object.assign(this, partial);
  }
}

export class PropertyListRes extends ListRes {
  @Transform((a) => (a ? a.map((i: Property) => new PropertyRes(i)) : []))
  list: PropertyRes[];

  constructor(partial: Partial<PropertyListRes>) {
    super();
    Object.assign(this, partial);
  }
}
