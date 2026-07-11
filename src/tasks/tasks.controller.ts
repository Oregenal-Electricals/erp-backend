import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, UpdateTaskStatusDto, AddCommentDto } from './dto/task.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.enum';

@Controller('tasks')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('stats')
  @RequirePermissions(Permission.SYSTEM_VIEW)
  getStats(@Request() req: any) { return this.tasksService.getStats(req.user); }

  @Get()
  @RequirePermissions(Permission.SYSTEM_VIEW)
  findAll(@Request() req: any, @Query() query: any) { return this.tasksService.findAll(req.user, query); }

  @Get(':id')
  @RequirePermissions(Permission.SYSTEM_VIEW)
  findOne(@Param('id') id: string, @Request() req: any) { return this.tasksService.findOne(id, req.user); }

  @Post()
  @RequirePermissions(Permission.SYSTEM_CREATE)
  create(@Body() dto: CreateTaskDto, @Request() req: any) { return this.tasksService.create(dto, req.user); }

  @Put(':id')
  @RequirePermissions(Permission.SYSTEM_EDIT)
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto, @Request() req: any) { return this.tasksService.update(id, dto, req.user); }

  @Post(':id/status')
  @RequirePermissions(Permission.SYSTEM_EDIT)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateTaskStatusDto, @Request() req: any) { return this.tasksService.updateStatus(id, dto, req.user); }

  @Post(':id/comments')
  @RequirePermissions(Permission.SYSTEM_CREATE)
  addComment(@Param('id') id: string, @Body() dto: AddCommentDto, @Request() req: any) { return this.tasksService.addComment(id, dto, req.user); }
}
