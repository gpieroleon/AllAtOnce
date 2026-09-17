import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class OrderItemDto {
  @IsInt()
  id: number;

  @IsInt()
  @Min(1)
  qty: number;
}

export class AddressDto {
  @IsString()
  nombre: string;

  @IsString()
  email: string;

  @IsString()
  telefono: string;

  @IsString()
  direccion: string;

  @IsString()
  ciudad: string;

  @IsString()
  provincia: string;

  @IsString()
  cp: string;

  @IsString()
  pais: string;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @IsString()
  shippingId: string;

  @IsString()
  paymentId: string;

  @IsOptional()
  @IsString()
  coupon?: string;
}

export class UpdateOrderDto {
  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsString()
  tracking?: string;
}
