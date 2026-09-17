import { IsNumber, IsString, Min } from 'class-validator';

export class ValidateCouponDto {
  @IsString()
  code: string;

  @IsNumber()
  @Min(0)
  subtotal: number;
}

export class CreateCouponDto {
  @IsString()
  code: string;

  @IsString()
  tipo: 'pct' | 'fijo';

  @IsNumber()
  @Min(0)
  valor: number;

  @IsString()
  descripcion?: string;
}
