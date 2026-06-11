import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { FloorsService } from './floors.service';
import { CreateFloorDto } from './dto/create-floor.dto';
import { UpdateFloorDto } from './dto/update-floor.dto';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Floors')
@Controller('floors')
export class FloorsController {
  constructor(private readonly floorsService: FloorsService) {}

  @Get()
  @Permissions('floor.view')
  findAll(@Query('buildingId') buildingId?: string) {
    return this.floorsService.findAll(buildingId);
  }

  @Get(':id')
  @Permissions('floor.view')
  findOne(@Param('id') id: string) {
    return this.floorsService.findOne(id);
  }

  @Post()
  @Permissions('floor.create')
  create(@Body() dto: CreateFloorDto, @CurrentUser('id') userId: string) {
    return this.floorsService.create(dto, userId);
  }

  @Patch(':id')
  @Permissions('floor.update')
  update(@Param('id') id: string, @Body() dto: UpdateFloorDto, @CurrentUser('id') userId: string) {
    return this.floorsService.update(id, dto, userId);
  }

  @Delete(':id')
  @Permissions('floor.delete')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.floorsService.remove(id, userId);
  }

  @Patch(':id/activate')
  @Permissions('floor.update')
  activate(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.floorsService.activate(id, userId);
  }

  @Patch(':id/deactivate')
  @Permissions('floor.update')
  deactivate(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.floorsService.deactivate(id, userId);
  }
}
