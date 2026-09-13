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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkedLessonService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const lesson_type_entity_1 = require("./entities/lesson-type.entity");
const schedule_item_entity_1 = require("./entities/schedule-item.entity");
const linked_lecture_utils_1 = require("./linked-lecture.utils");
let LinkedLessonService = class LinkedLessonService {
    itemsRepository;
    constructor(itemsRepository) {
        this.itemsRepository = itemsRepository;
    }
    async findLinkedSharedLessonItems(item) {
        if (!(0, linked_lecture_utils_1.isSharedMultiGroupLessonItem)(item)) {
            return [item];
        }
        const groupName = item.schedule?.group?.name;
        if (!groupName) {
            return [item];
        }
        const query = this.itemsRepository
            .createQueryBuilder('item')
            .innerJoinAndSelect('item.schedule', 'schedule')
            .innerJoinAndSelect('schedule.group', 'group')
            .innerJoinAndSelect('item.subject', 'subject')
            .innerJoinAndSelect('item.lessonType', 'lessonType')
            .leftJoinAndSelect('item.teacher', 'teacher')
            .leftJoinAndSelect('item.room', 'room')
            .leftJoinAndSelect('item.subgroup', 'subgroup')
            .where('item.isDisabled = false')
            .andWhere('schedule.isActive = true')
            .andWhere('item.weekStart = :weekStart', { weekStart: item.weekStart })
            .andWhere('item.dayOfWeek = :dayOfWeek', { dayOfWeek: item.dayOfWeek })
            .andWhere('item.startTime = :startTime', { startTime: item.startTime })
            .andWhere('item.endTime = :endTime', { endTime: item.endTime })
            .andWhere('item.subjectId = :subjectId', { subjectId: item.subjectId })
            .andWhere('item.lessonTypeId = :lessonTypeId', { lessonTypeId: item.lessonTypeId })
            .andWhere('item.subgroupId IS NOT DISTINCT FROM :subgroupId', {
            subgroupId: item.subgroupId,
        })
            .andWhere('lessonType.code IN (:...lessonTypeCodes)', {
            lessonTypeCodes: [lesson_type_entity_1.LessonTypeCode.LECTURE, lesson_type_entity_1.LessonTypeCode.SPECIAL],
        });
        if (item.teacherId) {
            query.andWhere('item.teacherId = :teacherId', { teacherId: item.teacherId });
        }
        else {
            query.andWhere('item.legacyTeacherName IS NOT DISTINCT FROM :legacyTeacherName', {
                legacyTeacherName: item.legacyTeacherName,
            });
        }
        if (item.roomId) {
            query.andWhere('item.roomId = :roomId', { roomId: item.roomId });
        }
        else {
            query.andWhere('item.roomId IS NULL');
        }
        const candidates = await query.getMany();
        return candidates.filter((candidate) => (0, linked_lecture_utils_1.areLinkedSharedLessonItems)(item, candidate));
    }
    async buildLinkedGroupsMap(items) {
        const linkedGroupsMap = new Map();
        const slotCache = new Map();
        for (const item of items) {
            const groupName = item.schedule?.group?.name ?? '';
            if (!(0, linked_lecture_utils_1.isSharedMultiGroupLessonItem)(item)) {
                linkedGroupsMap.set(item.id, groupName ? [groupName] : []);
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
            let groupNames = slotCache.get(slotKey);
            if (!groupNames) {
                const linkedItems = await this.findLinkedSharedLessonItems(item);
                groupNames = (0, linked_lecture_utils_1.extractLinkedGroupNames)(linkedItems);
                slotCache.set(slotKey, groupNames);
            }
            linkedGroupsMap.set(item.id, groupNames);
        }
        return linkedGroupsMap;
    }
};
exports.LinkedLessonService = LinkedLessonService;
exports.LinkedLessonService = LinkedLessonService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(schedule_item_entity_1.ScheduleItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], LinkedLessonService);
//# sourceMappingURL=linked-lesson.service.js.map