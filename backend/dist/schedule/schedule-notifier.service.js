"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleNotifierService = void 0;
const common_1 = require("@nestjs/common");
const schedule_gateway_1 = require("./schedule.gateway");
const schedule_item_mapper_1 = require("./schedule-item.mapper");
const linked_lecture_utils_1 = require("./linked-lecture.utils");
const linked_lesson_service_1 = require("./linked-lesson.service");
let ScheduleNotifierService = class ScheduleNotifierService {
    scheduleGateway;
    linkedLessonService;
    constructor(scheduleGateway, linkedLessonService) {
        this.scheduleGateway = scheduleGateway;
        this.linkedLessonService = linkedLessonService;
    }
    getTargetsForItems(items) {
        const targets = [];
        for (const item of items) {
            const groupName = item.schedule?.group?.name?.trim();
            const teacherName = (0, schedule_item_mapper_1.resolveTeacherName)(item).trim();
            const roomName = (0, schedule_item_mapper_1.formatRoomLabel)(item.room).trim();
            if (groupName) {
                targets.push({ type: 'group', identity: groupName });
            }
            if (teacherName) {
                targets.push({ type: 'teacher', identity: teacherName });
            }
            if (roomName) {
                targets.push({ type: 'room', identity: roomName });
            }
        }
        return targets;
    }
    async getTargetsForItemsAndLinkedLessons(items) {
        const itemsById = new Map();
        const linkedItemsBySlot = new Map();
        for (const item of items) {
            if (!(0, linked_lecture_utils_1.isSharedMultiGroupLessonItem)(item)) {
                itemsById.set(item.id, item);
                continue;
            }
            const slotKey = [
                item.weekStart,
                item.dayOfWeek,
                item.startTime,
                item.endTime,
                item.subjectId,
                item.lessonTypeId,
                item.teacherId ?? '',
                item.legacyTeacherName ?? '',
                item.roomId ?? '',
                item.subgroupId ?? '',
            ].join('|');
            let linkedItems = linkedItemsBySlot.get(slotKey);
            if (!linkedItems) {
                linkedItems = await this.linkedLessonService.findLinkedSharedLessonItems(item);
                linkedItemsBySlot.set(slotKey, linkedItems);
            }
            for (const linkedItem of linkedItems) {
                itemsById.set(linkedItem.id, linkedItem);
            }
        }
        return this.getTargetsForItems(Array.from(itemsById.values()));
    }
    notifyScheduleChanged(reason, targets) {
        this.scheduleGateway.broadcastScheduleChanged({ reason }, targets);
    }
    notifyPreholidayDaysUpdated(preholidayDays) {
        this.scheduleGateway.broadcastPreholidayDaysUpdated(preholidayDays);
        this.scheduleGateway.broadcastGlobalScheduleChanged({ reason: 'preholiday-updated' });
    }
};
exports.ScheduleNotifierService = ScheduleNotifierService;
exports.ScheduleNotifierService = ScheduleNotifierService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [schedule_gateway_1.ScheduleGateway,
        linked_lesson_service_1.LinkedLessonService])
], ScheduleNotifierService);
//# sourceMappingURL=schedule-notifier.service.js.map