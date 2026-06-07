import {
  Controller, Get, Post, Put, Patch,
  Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ItemMasterService } from './item-master.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CreateUomDto, UpdateUomDto,
  CreateCategoryDto, UpdateCategoryDto,
  CreateItemDto, UpdateItemDto,
} from './dto/item-master.dto';

@ApiTags('Item Master')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('items')
export class ItemMasterController {
  constructor(private readonly service: ItemMasterService) {}

  // ── UOM ──────────────────────────────────────────────────────
  @Post('uom')
  @ApiOperation({ summary: 'Create Unit of Measure' })
  createUom(@Body() dto: CreateUomDto, @CurrentUser() user: any) {
    return this.service.createUom(dto, user);
  }

  @Get('uom')
  @ApiOperation({ summary: 'List all UOMs' })
  findAllUoms(@CurrentUser() user: any) {
    return this.service.findAllUoms(user);
  }

  @Put('uom/:id')
  @ApiOperation({ summary: 'Update UOM' })
  updateUom(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUomDto, @CurrentUser() user: any) {
    return this.service.updateUom(id, dto, user);
  }

  @Patch('uom/:id/toggle')
  @ApiOperation({ summary: 'Toggle UOM active status' })
  toggleUom(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.toggleUomStatus(id, user);
  }

  // ── CATEGORY ─────────────────────────────────────────────────
  @Post('categories')
  @ApiOperation({ summary: 'Create Item Category' })
  createCategory(@Body() dto: CreateCategoryDto, @CurrentUser() user: any) {
    return this.service.createCategory(dto, user);
  }

  @Get('categories')
  @ApiOperation({ summary: 'List all categories' })
  findAllCategories(@CurrentUser() user: any) {
    return this.service.findAllCategories(user);
  }

  @Put('categories/:id')
  @ApiOperation({ summary: 'Update category' })
  updateCategory(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCategoryDto, @CurrentUser() user: any) {
    return this.service.updateCategory(id, dto, user);
  }

  // ── ITEM ─────────────────────────────────────────────────────
  @Post()
  @ApiOperation({ summary: 'Create Item' })
  createItem(@Body() dto: CreateItemDto, @CurrentUser() user: any) {
    return this.service.createItem(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List all items' })
  @ApiQuery({ name: 'itemType',   required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'status',     required: false })
  @ApiQuery({ name: 'search',     required: false })
  findAllItems(
    @CurrentUser() user: any,
    @Query('itemType')   itemType?: string,
    @Query('categoryId') categoryId?: string,
    @Query('status')     status?: string,
    @Query('search')     search?: string,
  ) {
    return this.service.findAllItems(user, { itemType, categoryId, search, status });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get item statistics' })
  getStats(@CurrentUser() user: any) {
    return this.service.getStats(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get item by ID' })
  findOneItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOneItem(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update item' })
  updateItem(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateItemDto, @CurrentUser() user: any) {
    return this.service.updateItem(id, dto, user);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle item status' })
  toggleItem(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.toggleItemStatus(id, user);
  }
}
