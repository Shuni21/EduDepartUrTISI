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
exports.ScheduleDisplayService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_item_entity_1 = require("./entities/schedule-item.entity");
const schedule_entity_1 = require("./entities/schedule.entity");
const role_entity_1 = require("../users/entities/role.entity");
const user_entity_1 = require("../users/entities/user.entity");
const schedule_item_mapper_1 = require("./schedule-item.mapper");
const roman_room_utils_1 = require("./parser/roman-room.utils");
const schedule_slot_utils_1 = require("./parser/schedule-slot.utils");
const schedule_period_utils_1 = require("./parser/schedule-period.utils");
const linked_lesson_service_1 = require("./linked-lesson.service");
const DISTANCE_BUILDING = 'Дистанционное';
const DISTANCE_ROOM_LABEL = 'дист. форм. об.';
const ITEM_RELATIONS = [
    'schedule',
    'schedule.group',
    'schedule.upload',
    'subject',
    'subgroup',
    'lessonType',
    'teacher',
    'room',
];
let ScheduleDisplayService = class ScheduleDisplayService {
    itemsRepository;
    schedulesRepository;
    usersRepository;
    linkedLessonService;
    constructor(itemsRepository, schedulesRepository, usersRepository, linkedLessonService) {
        this.itemsRepository = itemsRepository;
        this.schedulesRepository = schedulesRepository;
        this.usersRepository = usersRepository;
        this.linkedLessonService = linkedLessonService;
    }
    normalizeText(value) {
        return value.trim().toUpperCase();
    }
    parseDateValue(value) {
        if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
            const [year, month, day] = value.split('-').map(Number);
            return new Date(year, month - 1, day);
        }
        const dottedMatch = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
        if (dottedMatch) {
            return new Date(Number(dottedMatch[3]), Number(dottedMatch[2]) - 1, Number(dottedMatch[1]));
        }
        return new Date(value);
    }
    formatWeekLabel(weekStart) {
        const start = this.parseDateValue(weekStart);
        const day = start.getDay();
        const diffToMonday = day === 0 ? -6 : 1 - day;
        start.setDate(start.getDate() + diffToMonday);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        const pad = (part) => String(part).padStart(2, '0');
        return `${pad(start.getDate())}.${pad(start.getMonth() + 1)} - ${pad(end.getDate())}.${pad(end.getMonth() + 1)}`;
    }
    async buildWeeksFromItems(items) {
        const weeks = new Map();
        const weekOrder = [];
        const linkedGroupsMap = await this.linkedLessonService.buildLinkedGroupsMap(items);
        for (const item of items) {
            const weekLabel = this.formatWeekLabel(String(item.weekStart));
            if (!weeks.has(weekLabel)) {
                weeks.set(weekLabel, []);
                weekOrder.push(weekLabel);
            }
            weeks.get(weekLabel)?.push((0, schedule_item_mapper_1.mapItemToDisplayLesson)(item, linkedGroupsMap.get(item.id)));
        }
        const orderedWeeks = {};
        for (const weekLabel of weekOrder) {
            orderedWeeks[weekLabel] = weeks.get(weekLabel) ?? [];
        }
        return orderedWeeks;
    }
    baseItemsQuery() {
        return this.itemsRepository
            .createQueryBuilder('item')
            .innerJoinAndSelect('item.schedule', 'schedule')
            .innerJoinAndSelect('schedule.group', 'group')
            .leftJoinAndSelect('schedule.upload', 'upload')
            .leftJoinAndSelect('item.subject', 'subject')
            .leftJoinAndSelect('item.subgroup', 'subgroup')
            .leftJoinAndSelect('item.lessonType', 'lessonType')
            .leftJoinAndSelect('item.teacher', 'teacher')
            .leftJoinAndSelect('item.room', 'room')
            .where('item.isDisabled = false')
            .andWhere('schedule.isActive = true')
            .orderBy('item.weekStart', 'ASC')
            .addOrderBy('item.dayOfWeek', 'ASC')
            .addOrderBy('item.startTime', 'ASC');
    }
    getBuildingFromRoom(room) {
        const normalized = room.trim().toUpperCase();
        if (normalized.includes('УК1')) {
            return 'УК1';
        }
        if (normalized.includes('УК2') || normalized.includes('УК№2')) {
            return 'УК2';
        }
        if (normalized.includes('УК3') || normalized.includes('УК№3')) {
            return 'УК3';
        }
        if (normalized.includes('УК4') || normalized.includes('УК№4')) {
            return 'УК4';
        }
        if (normalized.includes('УК5') || normalized.includes('УК№5')) {
            return 'УК5';
        }
        const romanBuilding = (0, roman_room_utils_1.getRomanBuilding)(room);
        if (romanBuilding) {
            return romanBuilding;
        }
        return null;
    }
    isRomanRoomLabel(room) {
        return (0, roman_room_utils_1.isRomanRoom)(room);
    }
    isDistanceRoom(room) {
        return /дист/i.test(room);
    }
    async listGroups() {
        const schedules = await this.schedulesRepository.find({
            where: {
                scheduleType: schedule_entity_1.ScheduleType.STUDENT,
                isActive: true,
            },
            relations: ['group', 'upload'],
            order: { validFrom: 'DESC' },
        });
        const groups = new Map();
        for (const schedule of schedules) {
            if (!schedule.group?.name) {
                continue;
            }
            const key = this.normalizeText(schedule.group.name);
            if (!groups.has(key)) {
                groups.set(key, {
                    groupName: schedule.group.name,
                    facultyName: schedule.upload?.facultyName ?? null,
                });
            }
        }
        return Array.from(groups.values()).sort((left, right) => left.groupName.localeCompare(right.groupName, 'ru', {
            sensitivity: 'base',
            numeric: true,
        }));
    }
    async getGroupSchedule(groupName) {
        const normalizedGroupName = this.normalizeText(groupName);
        const items = await this.baseItemsQuery()
            .andWhere('UPPER(TRIM(group.name)) = :groupName', {
            groupName: normalizedGroupName,
        })
            .getMany();
        return {
            groupName: items[0]?.schedule?.group?.name ?? groupName.trim(),
            weeks: await this.buildWeeksFromItems(items),
            ...(0, schedule_period_utils_1.resolveSchedulePeriodMeta)(items),
        };
    }
    async listTeachers(departmentId) {
        const teachers = new Set();
        await this.collectTeachersFromAccounts(teachers, departmentId);
        await this.collectTeachersFromSchedule(teachers, departmentId);
        return Array.from(teachers).sort((left, right) => left.localeCompare(right, 'ru', { sensitivity: 'base' }));
    }
    async collectTeachersFromAccounts(teachers, departmentId) {
        const qb = this.usersRepository
            .createQueryBuilder('user')
            .innerJoin('user.role', 'role')
            .innerJoin('user.teacherProfile', 'teacherProfile')
            .where('user.isActive = true')
            .andWhere('role.code = :roleCode', { roleCode: role_entity_1.RoleCode.TEACHER });
        if (departmentId) {
            qb.andWhere('teacherProfile.departmentId = :departmentId', { departmentId });
        }
        const users = await qb.getMany();
        for (const user of users) {
            teachers.add((0, schedule_item_mapper_1.formatTeacherName)(user));
        }
    }
    async collectTeachersFromSchedule(teachers, departmentId) {
        const qb = this.baseItemsQuery()
            .leftJoin('item.teacher', 'teacherUser')
            .leftJoin('teacherUser.teacherProfile', 'teacherProfile');
        if (departmentId) {
            qb.andWhere('teacherUser.id IS NOT NULL AND teacherProfile.departmentId = :departmentId', { departmentId });
        }
        const items = await qb.getMany();
        for (const item of items) {
            if (item.teacher) {
                teachers.add((0, schedule_item_mapper_1.formatTeacherName)(item.teacher));
                continue;
            }
            if (!departmentId) {
                const legacyName = item.legacyTeacherName?.trim();
                if (legacyName) {
                    teachers.add(legacyName);
                }
            }
        }
    }
    async getTeacherSchedule(teacherName) {
        const normalizedTeacherName = this.normalizeText(teacherName);
        const items = await this.baseItemsQuery().getMany();
        const matchedItems = items.filter((item) => {
            const resolvedName = item.teacher
                ? (0, schedule_item_mapper_1.formatTeacherName)(item.teacher)
                : item.legacyTeacherName?.trim() ?? '';
            return this.normalizeText(resolvedName) === normalizedTeacherName;
        });
        const resolvedTeacherName = matchedItems[0]
            ? (matchedItems[0].teacher
                ? (0, schedule_item_mapper_1.formatTeacherName)(matchedItems[0].teacher)
                : matchedItems[0].legacyTeacherName?.trim() ?? teacherName.trim())
            : teacherName.trim();
        return {
            teacherName: resolvedTeacherName,
            weeks: await this.buildWeeksFromItems(matchedItems),
            ...(0, schedule_period_utils_1.resolveSchedulePeriodMeta)(matchedItems),
        };
    }
    async listBuildings() {
        const rooms = await this.listRooms();
        const buildings = new Set();
        for (const room of rooms) {
            if (this.isDistanceRoom(room)) {
                buildings.add(DISTANCE_BUILDING);
            }
            if (this.isRomanRoomLabel(room)) {
                buildings.add(roman_room_utils_1.ROMAN_BUILDING);
            }
            const building = this.getBuildingFromRoom(room);
            if (building) {
                buildings.add(building);
            }
        }
        const standardBuildings = ['УК1', 'УК2', 'УК3', 'УК4', 'УК5'];
        const ordered = standardBuildings.filter((building) => buildings.has(building));
        if (!ordered.includes(roman_room_utils_1.ROMAN_BUILDING)) {
            ordered.push(roman_room_utils_1.ROMAN_BUILDING);
        }
        if (!ordered.includes(DISTANCE_BUILDING)) {
            ordered.push(DISTANCE_BUILDING);
        }
        return ordered;
    }
    async listRooms(building) {
        const items = await this.baseItemsQuery().getMany();
        const physicalRooms = new Map();
        const distanceRooms = new Map();
        for (const item of items) {
            const label = (0, schedule_item_mapper_1.formatRoomLabel)(item.room);
            if (!label) {
                continue;
            }
            const roomKey = (0, schedule_slot_utils_1.normalizeRoomListKey)(label);
            if (this.isDistanceRoom(label)) {
                const existing = distanceRooms.get(roomKey);
                distanceRooms.set(roomKey, existing ? (0, schedule_slot_utils_1.pickPreferredRoomLabel)(existing, label) : label);
            }
            else {
                const existing = physicalRooms.get(roomKey);
                physicalRooms.set(roomKey, existing ? (0, schedule_slot_utils_1.pickPreferredRoomLabel)(existing, label) : label);
            }
        }
        const sortRooms = (left, right) => left.localeCompare(right, 'ru', { sensitivity: 'base', numeric: true });
        if (!building?.trim()) {
            return Array.from(physicalRooms.values()).sort(sortRooms);
        }
        const normalizedBuilding = building.trim().toUpperCase();
        if (normalizedBuilding === DISTANCE_BUILDING.toUpperCase()) {
            const roomList = Array.from(distanceRooms.values()).sort(sortRooms);
            if (!roomList.includes(DISTANCE_ROOM_LABEL)) {
                roomList.unshift(DISTANCE_ROOM_LABEL);
            }
            return roomList;
        }
        if (normalizedBuilding === roman_room_utils_1.ROMAN_BUILDING.toUpperCase()) {
            return Array.from(physicalRooms.values())
                .filter((room) => this.isRomanRoomLabel(room))
                .sort(sortRooms);
        }
        return Array.from(physicalRooms.values())
            .filter((room) => this.getBuildingFromRoom(room)?.toUpperCase() === normalizedBuilding)
            .sort(sortRooms);
    }
    async getRoomSchedule(roomName) {
        const normalizedRoomName = (0, schedule_slot_utils_1.normalizeRoomListKey)(roomName);
        const items = await this.baseItemsQuery().getMany();
        const matchedItems = items.filter((item) => (0, schedule_slot_utils_1.normalizeRoomListKey)((0, schedule_item_mapper_1.formatRoomLabel)(item.room)) === normalizedRoomName);
        return {
            room: matchedItems[0]
                ? (0, schedule_item_mapper_1.formatRoomLabel)(matchedItems[0].room)
                : roomName.trim(),
            weeks: await this.buildWeeksFromItems(matchedItems),
            ...(0, schedule_period_utils_1.resolveSchedulePeriodMeta)(matchedItems),
        };
    }
};
exports.ScheduleDisplayService = ScheduleDisplayService;
exports.ScheduleDisplayService = ScheduleDisplayService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(schedule_item_entity_1.ScheduleItem)),
    __param(1, (0, typeorm_1.InjectRepository)(schedule_entity_1.Schedule)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        linked_lesson_service_1.LinkedLessonService])
], ScheduleDisplayService);
//# sourceMappingURL=schedule-display.service.js.map