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
    UseGuards,
} from '@nestjs/common';

import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import {
    CreateScheduleItemDto,
    ScheduleItemPreviewDto,
    ScheduleItemPreviewResultDto,
    ScheduleTransferRecommendationDto,
    ScheduleTransferRecommendationQueryDto,
    UpdateScheduleItemDto,
    BulkDisableByTeacherDto,
    BulkDisableResultDto,
} from './dto/schedule-item.dto';
import { EducationDepartmentGuard } from './guards/education-department.guard';
import { ScheduleAdminService } from './schedule-admin.service';
import { ScheduleDisplayLesson } from './schedule-display.service';

@Controller('education-department/schedules/items')
@UseGuards(AccessTokenGuard, EducationDepartmentGuard)
export class ScheduleAdminController {
    constructor(
        private readonly scheduleAdminService: ScheduleAdminService,
    ) {}

    @Post()
    createItem(@Body() dto: CreateScheduleItemDto): Promise<ScheduleDisplayLesson> {
        return this.scheduleAdminService.createItem(dto);
    }

    @Post('bulk-disable')
    bulkDisableByTeacher(
        @Body() dto: BulkDisableByTeacherDto,
    ): Promise<BulkDisableResultDto> {
        return this.scheduleAdminService.disableItemsByTeacher(dto);
    }

    @Get(':id/recommendations')
    getTransferRecommendations(
        @Param('id', ParseIntPipe) id: number,
        @Query() query: ScheduleTransferRecommendationQueryDto,
    ): Promise<ScheduleTransferRecommendationDto[]> {
        return this.scheduleAdminService.getTransferRecommendations(id, query.weekStart);
    }

    @Post(':id/preview')
    previewItemChanges(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: ScheduleItemPreviewDto,
    ): Promise<ScheduleItemPreviewResultDto> {
        return this.scheduleAdminService.previewItemChanges(id, dto);
    }

    @Get(':id/linked-groups')
    getLinkedGroupNames(@Param('id', ParseIntPipe) id: number): Promise<string[]> {
        return this.scheduleAdminService.getLinkedGroupNames(id);
    }

    @Patch(':id')
    updateItem(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateScheduleItemDto,
    ): Promise<ScheduleDisplayLesson> {
        return this.scheduleAdminService.updateItem(id, dto);
    }

    @Patch(':id/disable')
    disableItem(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.scheduleAdminService.disableItem(id);
    }

    @Delete(':id')
    deleteItem(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.scheduleAdminService.deleteItem(id);
    }
}
