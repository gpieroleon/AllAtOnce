import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import {
  BulkPatchDto,
  CreateProductDto,
  StockDto,
  UpdateProductDto,
} from './dto';
import { Roles } from '../common/roles.decorator';
import { ReviewsService } from '../reviews/reviews.service';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly products: ProductsService,
    private readonly reviewsService: ReviewsService,
  ) {}

  @Get()
  list(@Query() query: { cat?: string; q?: string; sort?: string }) {
    return this.products.listPublic(query);
  }

  @Get(':idOrSlug')
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.products.findOne(idOrSlug);
  }

  @Get(':id/reviews')
  reviews(@Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.forProduct(id);
  }

  @Roles('admin', 'superadmin')
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.products.create(
      dto as unknown as Record<string, unknown> & { name: string; cat: string },
    );
  }

  @Roles('admin', 'superadmin')
  @Patch('bulk')
  bulk(@Body() dto: BulkPatchDto) {
    return this.products.bulk(dto.ids, dto.patch);
  }

  @Roles('admin', 'superadmin')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto as unknown as Record<string, unknown>);
  }

  @Roles('admin', 'superadmin')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.products.remove(id);
  }
}

@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly products: ProductsService) {}

  @Roles('admin', 'superadmin')
  @Patch(':id/stock')
  stock(@Param('id', ParseIntPipe) id: number, @Body() dto: StockDto) {
    return this.products.setStock(id, dto.stock);
  }
}
