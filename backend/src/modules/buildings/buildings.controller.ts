import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { BuildingsService } from './buildings.service';
import { CreateBuildingDto } from './dto/create-building.dto';
import { UpdateBuildingDto } from './dto/update-building.dto';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Buildings')
@Controller('buildings')
export class BuildingsController {
  constructor(private readonly buildingsService: BuildingsService) {}

  @Get()
  @Permissions('building.view')
  findAll(@Query() query: PaginationQueryDto) {
    return this.buildingsService.findAll(query);
  }

  @Get(':id')
  @Permissions('building.view')
  findOne(@Param('id') id: string) {
    return this.buildingsService.findOne(id);
  }

  @Post()
  @Permissions('building.create')
  create(@Body() dto: CreateBuildingDto, @CurrentUser('id') userId: string) {
    return this.buildingsService.create(dto, userId);
  }

  @Patch(':id')
  @Permissions('building.update')
  update(@Param('id') id: string, @Body() dto: UpdateBuildingDto, @CurrentUser('id') userId: string) {
    return this.buildingsService.update(id, dto, userId);
  }

  @Delete(':id')
  @Permissions('building.delete')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.buildingsService.remove(id, userId);
  }

  @Patch(':id/activate')
  @Permissions('building.update')
  activate(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.buildingsService.activate(id, userId);
  }

  @Patch(':id/deactivate')
  @Permissions('building.update')
  deactivate(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.buildingsService.deactivate(id, userId);
  }
}
