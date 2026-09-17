import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  descCorta?: string;

  @IsOptional()
  @IsString()
  descLarga?: string;

  @IsString()
  cat: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cats?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  etiquetas?: string[];

  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  old?: number;

  @IsOptional()
  @IsNumber()
  costo?: number;

  @IsInt()
  @Min(0)
  stock: number;

  @IsOptional()
  @IsArray()
  variantes?: { talla?: string; color?: string; stock: number }[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imagenes?: string[];

  @IsOptional()
  @IsNumber()
  peso?: number;

  @IsOptional()
  @IsNumber()
  rating?: number;

  @IsOptional()
  @IsInt()
  reviews?: number;

  @IsOptional()
  @IsIn(['flash', 'new', 'top'])
  badge?: 'flash' | 'new' | 'top' | null;

  @IsOptional()
  @IsBoolean()
  prime?: boolean;

  @IsOptional()
  @IsBoolean()
  deal?: boolean;

  @IsOptional()
  @IsIn(['publicado', 'borrador', 'agotado'])
  estado?: string;

  @IsOptional()
  @IsObject()
  specs?: Record<string, string>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  feats?: string[];

  @IsOptional()
  @IsString()
  metaTitulo?: string;

  @IsOptional()
  @IsString()
  metaDescripcion?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  g?: string[];
}

export class UpdateProductDto extends CreateProductDto {
  @IsOptional()
  @IsString()
  declare name: string;

  @IsOptional()
  @IsString()
  declare cat: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  declare stock: number;

  @IsOptional()
  @IsNumber()
  declare price: number;
}

export class BulkPatchDto {
  @IsArray()
  @IsInt({ each: true })
  ids: number[];

  @IsObject()
  patch: Record<string, unknown>;
}

export class StockDto {
  @IsInt()
  @Min(0)
  stock: number;
}
