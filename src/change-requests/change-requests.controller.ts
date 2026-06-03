import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ChangeRequestStatus, ChangeRequestType } from '@prisma/client';
import { ChangeRequestsService } from './change-requests.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CreateChangeRequestDto,
  UpdateChangeRequestDto,
  ReviewChangeRequestDto,
  AddCommentDto,
} from './dto/change-request.dto';

@ApiTags('Change Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('change-requests')
export class ChangeRequestsController {
  constructor(private readonly service: ChangeRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new change request (any user)' })
  create(@Body() dto: CreateChangeRequestDto, @CurrentUser() user: any) {
    return this.service.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List change requests (filtered by role)' })
  @ApiQuery({ name: 'status', required: false, enum: ChangeRequestStatus })
  @ApiQuery({ name: 'type', required: false, enum: ChangeRequestType })
  @ApiQuery({ name: 'myRequests', required: false, type: Boolean })
  @ApiQuery({ name: 'pendingApproval', required: false, type: Boolean })
  findAll(
    @CurrentUser() user: any,
    @Query('status') status?: ChangeRequestStatus,
    @Query('type') type?: string,
    @Query('myRequests') myRequests?: string,
    @Query('pendingApproval') pendingApproval?: string,
  ) {
    return this.service.findAll(user, {
      status,
      type,
      myRequests: myRequests === 'true',
      pendingApproval: pendingApproval === 'true',
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get change request statistics' })
  getStats(@CurrentUser() user: any) {
    return this.service.getStats(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get change request by ID with comments' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update change request (DRAFT only, own request)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateChangeRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user);
  }

  @Patch(':id/submit')
  @ApiOperation({ summary: 'Submit request for approval' })
  submit(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.submit(id, user);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a change request (approvers only)' })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewChangeRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.service.approve(id, dto, user);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject a change request (approvers only)' })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewChangeRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.service.reject(id, dto, user);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a change request' })
  cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.cancel(id, user);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a comment to a change request' })
  addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddCommentDto,
    @CurrentUser() user: any,
  ) {
    return this.service.addComment(id, dto, user);
  }
}
