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
var ScheduleImportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleImportService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const group_entity_1 = require("../academic/entities/group.entity");
const direction_entity_1 = require("../academic/entities/direction.entity");
const subject_entity_1 = require("../academic/entities/subject.entity");
const subgroup_entity_1 = require("../academic/entities/subgroup.entity");
const schedule_entity_1 = require("./entities/schedule.entity");
const schedule_item_entity_1 = require("./entities/schedule-item.entity");
const room_resolver_1 = require("./resolver/room.resolver");
const teacher_resolver_1 = require("./resolver/teacher.resolver");
const lesson_type_resolver_1 = require("./resolver/lesson-type.resolver");
let ScheduleImportService = class ScheduleImportService {
    static { ScheduleImportService_1 = this; }
    schedulesRepository;
    itemsRepository;
    groupsRepository;
    directionsRepository;
    subjectsRepository;
    subgroupsRepository;
    roomResolver;
    teacherResolver;
    lessonTypeResolver;
    static IMPORT_DIRECTION_CODE = 'SCHEDULE_IMPORT';
    constructor(schedulesRepository, itemsRepository, groupsRepository, directionsRepository, subjectsRepository, subgroupsRepository, roomResolver, teacherResolver, lessonTypeResolver) {
        this.schedulesRepository = schedulesRepository;
        this.itemsRepository = itemsRepository;
        this.groupsRepository = groupsRepository;
        this.directionsRepository = directionsRepository;
        this.subjectsRepository = subjectsRepository;
        this.subgroupsRepository = subgroupsRepository;
        this.roomResolver = roomResolver;
        this.teacherResolver = teacherResolver;
        this.lessonTypeResolver = lessonTypeResolver;
    }
    async findOrCreateImportDirection() {
        let direction = await this.directionsRepository.findOne({
            where: { code: ScheduleImportService_1.IMPORT_DIRECTION_CODE },
        });
        if (!direction) {
            direction = await this.directionsRepository.save(this.directionsRepository.create({
                code: ScheduleImportService_1.IMPORT_DIRECTION_CODE,
                name: 'Импорт расписания',
            }));
        }
        return direction;
    }
    async findOrCreateGroup(groupName) {
        const trimmed = groupName.trim();
        const existing = await this.groupsRepository.findOne({
            where: { name: trimmed },
        });
        if (existing) {
            return existing;
        }
        const direction = await this.findOrCreateImportDirection();
        return this.groupsRepository.save(this.groupsRepository.create({
            name: trimmed,
            directionId: direction.id,
            course: 1,
            educationForm: group_entity_1.EducationForm.FULL_TIME,
        }));
    }
    async findOrCreateSubject(name) {
        const trimmed = name.trim();
        let subject = await this.subjectsRepository.findOne({
            where: { name: trimmed },
        });
        if (!subject) {
            subject = await this.subjectsRepository.save(this.subjectsRepository.create({
                name: trimmed,
                description: null,
            }));
        }
        return subject;
    }
    async findSubgroup(groupId, number) {
        if (!number) {
            return null;
        }
        const subgroupNumber = number;
        const existing = await this.subgroupsRepository.findOne({
            where: {
                groupId,
                number: subgroupNumber,
            },
        });
        if (existing) {
            return existing;
        }
        return this.subgroupsRepository.save(this.subgroupsRepository.create({
            groupId,
            number: subgroupNumber,
        }));
    }
    toDate(value) {
        const [day, month, year] = value.split('.');
        const pad = (part) => part.padStart(2, '0');
        return `${year}-${pad(month)}-${pad(day)}`;
    }
    dedupeWarnings(warnings) {
        return [...new Set(warnings)];
    }
    static isImportResolvableWarning(warning) {
        return warning.startsWith('Преподаватель не найден в БД:')
            || warning.startsWith('Подгруппа ');
    }
    static mergeStoredWarnings(stored, importWarnings) {
        const staticWarnings = (stored ?? []).filter((warning) => !ScheduleImportService_1.isImportResolvableWarning(warning));
        return ScheduleImportService_1.dedupeWarningsStatic([
            ...staticWarnings,
            ...importWarnings,
        ]);
    }
    static dedupeWarningsStatic(warnings) {
        return [...new Set(warnings)];
    }
    async refreshUploadReferences(uploadId) {
        const schedule = await this.schedulesRepository.findOne({
            where: { uploadId },
            relations: ['items', 'items.subject', 'group'],
        });
        if (!schedule) {
            return [];
        }
        const importWarnings = [];
        for (const item of schedule.items) {
            if (item.isDisabled) {
                continue;
            }
            if (!item.teacherId && item.legacyTeacherName) {
                const teacher = await this.teacherResolver.resolve(item.legacyTeacherName);
                if (teacher) {
                    item.teacherId = teacher.id;
                    item.legacyTeacherName = null;
                    await this.itemsRepository.save(item);
                }
                else {
                    importWarnings.push(`Преподаватель не найден в БД: ${item.legacyTeacherName} (${item.subject.name})`);
                }
            }
        }
        return this.dedupeWarnings(importWarnings);
    }
    async importParsedSchedule(parsed, upload) {
        if (!parsed.periodStart || !parsed.periodEnd) {
            throw new common_1.BadRequestException('В файле не указан период расписания');
        }
        const warnings = [...parsed.warnings];
        const group = await this.findOrCreateGroup(parsed.groupName);
        const validFrom = this.toDate(parsed.periodStart);
        const validTo = this.toDate(parsed.periodEnd);
        let schedule = await this.schedulesRepository.findOne({
            where: {
                scheduleType: schedule_entity_1.ScheduleType.STUDENT,
                groupId: group.id,
                validFrom,
                validTo,
            },
        });
        if (schedule) {
            await this.itemsRepository.delete({ scheduleId: schedule.id });
            schedule.uploadId = upload.id;
            schedule.isActive = true;
            schedule = await this.schedulesRepository.save(schedule);
        }
        else {
            schedule = await this.schedulesRepository.save(this.schedulesRepository.create({
                scheduleType: schedule_entity_1.ScheduleType.STUDENT,
                groupId: group.id,
                teacherId: null,
                uploadId: upload.id,
                validFrom,
                validTo,
                isActive: true,
            }));
        }
        let itemsCount = 0;
        for (const slot of parsed.lessons) {
            const item = await this.mapSlotToItem(slot, schedule.id, group.id, warnings);
            if (!item) {
                continue;
            }
            await this.itemsRepository.save(item);
            itemsCount += 1;
        }
        return {
            scheduleId: schedule.id,
            itemsCount,
            warnings: this.dedupeWarnings(warnings),
        };
    }
    async mapSlotToItem(slot, scheduleId, groupId, warnings) {
        const subject = await this.findOrCreateSubject(slot.subject);
        const lessonType = await this.lessonTypeResolver.resolve(slot.lessonType);
        const room = await this.roomResolver.resolve(slot.room);
        const teacher = slot.teacherName
            ? await this.teacherResolver.resolve(slot.teacherName)
            : null;
        if (slot.teacherName && !teacher) {
            warnings.push(`Преподаватель не найден в БД: ${slot.teacherName} (${slot.subject})`);
        }
        const subgroup = await this.findSubgroup(groupId, slot.subgroup);
        return this.itemsRepository.create({
            scheduleId,
            subjectId: subject.id,
            subgroupId: subgroup?.id ?? null,
            lessonTypeId: lessonType.id,
            teacherId: teacher?.id ?? null,
            roomId: room?.id ?? null,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            weekStart: this.toDate(slot.weekStart),
            weekType: null,
            comment: null,
            isDisabled: false,
            isSameCellParallel: slot.isSameCellParallel,
            teacherPosition: slot.teacherPosition || null,
            legacyTeacherName: teacher ? null : slot.teacherName,
        });
    }
};
exports.ScheduleImportService = ScheduleImportService;
exports.ScheduleImportService = ScheduleImportService = ScheduleImportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(schedule_entity_1.Schedule)),
    __param(1, (0, typeorm_1.InjectRepository)(schedule_item_entity_1.ScheduleItem)),
    __param(2, (0, typeorm_1.InjectRepository)(group_entity_1.Group)),
    __param(3, (0, typeorm_1.InjectRepository)(direction_entity_1.Direction)),
    __param(4, (0, typeorm_1.InjectRepository)(subject_entity_1.Subject)),
    __param(5, (0, typeorm_1.InjectRepository)(subgroup_entity_1.Subgroup)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        room_resolver_1.RoomResolver,
        teacher_resolver_1.TeacherResolver,
        lesson_type_resolver_1.LessonTypeResolver])
], ScheduleImportService);
//# sourceMappingURL=schedule-import.service.js.map