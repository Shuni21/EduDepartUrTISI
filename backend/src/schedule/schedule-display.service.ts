import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { ScheduleItem } from './entities/schedule-item.entity';
import { Schedule, ScheduleType } from './entities/schedule.entity';
import { RoleCode } from '../users/entities/role.entity';
import { User } from '../users/entities/user.entity';
import {
    formatRoomLabel,
    formatTeacherName,
    mapItemToDisplayLesson,
} from './schedule-item.mapper';
import {
    ROMAN_BUILDING,
    getRomanBuilding,
    isRomanRoom,
} from './parser/roman-room.utils';
import {
    normalizeRoomListKey,
    pickPreferredRoomLabel,
} from './parser/schedule-slot.utils';
import { splitPhysicalRoomLabels } from './parser/lesson-cell.parser';
import { resolveSchedulePeriodMeta } from './parser/schedule-period.utils';
import { LinkedLessonService } from './linked-lesson.service';
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
] as const;

export interface ScheduleGroupInfo {
    groupName: string;
    facultyName: string | null;
}

export interface ScheduleDisplayLesson {
    id: number;
    day: string;
    startTime: string;
    endTime: string;
    subject: string;
    teacher: string;
    type: string;
    room: string;
    group: string;
    linkedGroups: string[];
    subgroup: number | null;
    isSameCellParallel: boolean;
    comment: string | null;
    weekStart: string;
}

export interface GroupScheduleResponse {
    groupName: string;
    weeks: Record<string, ScheduleDisplayLesson[]>;
    academicYearLabel: string | null;
    periodStart: string | null;
    periodEnd: string | null;
    periodLabel: string | null;
}

export interface TeacherScheduleResponse {
    teacherName: string;
    weeks: Record<string, ScheduleDisplayLesson[]>;
    academicYearLabel: string | null;
    periodStart: string | null;
    periodEnd: string | null;
    periodLabel: string | null;
}

export interface RoomScheduleResponse {
    room: string;
    weeks: Record<string, ScheduleDisplayLesson[]>;
    academicYearLabel: string | null;
    periodStart: string | null;
    periodEnd: string | null;
    periodLabel: string | null;
}

@Injectable()
export class ScheduleDisplayService {
    constructor(
        @InjectRepository(ScheduleItem)
        private readonly itemsRepository: Repository<ScheduleItem>,
        @InjectRepository(Schedule)
        private readonly schedulesRepository: Repository<Schedule>,
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        private readonly linkedLessonService: LinkedLessonService,
    ) {}

    private normalizeText(value: string): string {
        return value.trim().toUpperCase();
    }

    private parseDateValue(value: string): Date {
        if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
            const [year, month, day] = value.split('-').map(Number);
            return new Date(year, month - 1, day);
        }

        const dottedMatch = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
        if (dottedMatch) {
            return new Date(
                Number(dottedMatch[3]),
                Number(dottedMatch[2]) - 1,
                Number(dottedMatch[1]),
            );
        }

        return new Date(value);
    }

    private formatWeekLabel(weekStart: string): string {
        const start = this.parseDateValue(weekStart);
        const day = start.getDay();
        const diffToMonday = day === 0 ? -6 : 1 - day;
        start.setDate(start.getDate() + diffToMonday);

        const end = new Date(start);
        end.setDate(end.getDate() + 6);

        const pad = (part: number) => String(part).padStart(2, '0');

        return `${pad(start.getDate())}.${pad(start.getMonth() + 1)} - ${pad(end.getDate())}.${pad(end.getMonth() + 1)}`;
    }

    private async buildWeeksFromItems(
        items: ScheduleItem[],
    ): Promise<Record<string, ScheduleDisplayLesson[]>> {
        const weeks = new Map<string, ScheduleDisplayLesson[]>();
        const weekOrder: string[] = [];
        const linkedGroupsMap = await this.linkedLessonService.buildLinkedGroupsMap(items);

        for (const item of items) {
            const weekLabel = this.formatWeekLabel(String(item.weekStart));

            if (!weeks.has(weekLabel)) {
                weeks.set(weekLabel, []);
                weekOrder.push(weekLabel);
            }

            weeks.get(weekLabel)?.push(
                mapItemToDisplayLesson(item, linkedGroupsMap.get(item.id)),
            );
        }

        const orderedWeeks: Record<string, ScheduleDisplayLesson[]> = {};

        for (const weekLabel of weekOrder) {
            orderedWeeks[weekLabel] = weeks.get(weekLabel) ?? [];
        }

        return orderedWeeks;
    }

    private baseItemsQuery() {
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

    getBuildingFromRoom(room: string): string | null {
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

        const romanBuilding = getRomanBuilding(room);
        if (romanBuilding) {
            return romanBuilding;
        }

        return null;
    }

    private isRomanRoomLabel(room: string): boolean {
        return isRomanRoom(room);
    }

    private isDistanceRoom(room: string): boolean {
        return /дист/i.test(room);
    }

    async listGroups(): Promise<ScheduleGroupInfo[]> {
        const schedules = await this.schedulesRepository.find({
            where: {
                scheduleType: ScheduleType.STUDENT,
                isActive: true,
            },
            relations: ['group', 'upload'],
            order: { validFrom: 'DESC' },
        });

        const groups = new Map<string, ScheduleGroupInfo>();

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

        return Array.from(groups.values()).sort((left, right) =>
            left.groupName.localeCompare(right.groupName, 'ru', {
                sensitivity: 'base',
                numeric: true,
            }),
        );
    }

    async getGroupSchedule(groupName: string): Promise<GroupScheduleResponse> {
        const normalizedGroupName = this.normalizeText(groupName);

        const items = await this.baseItemsQuery()
            .andWhere('UPPER(TRIM(group.name)) = :groupName', {
                groupName: normalizedGroupName,
            })
            .getMany();

        return {
            groupName: items[0]?.schedule?.group?.name ?? groupName.trim(),
            weeks: await this.buildWeeksFromItems(items),
            ...resolveSchedulePeriodMeta(items),
        };
    }

    async listTeachers(departmentId?: number): Promise<string[]> {
        const teachers = new Set<string>();

        await this.collectTeachersFromAccounts(teachers, departmentId);
        await this.collectTeachersFromSchedule(teachers, departmentId);

        return Array.from(teachers).sort((left, right) =>
            left.localeCompare(right, 'ru', { sensitivity: 'base' }),
        );
    }

    private async collectTeachersFromAccounts(
        teachers: Set<string>,
        departmentId?: number,
    ): Promise<void> {
        const qb = this.usersRepository
            .createQueryBuilder('user')
            .innerJoin('user.role', 'role')
            .innerJoin('user.teacherProfile', 'teacherProfile')
            .where('user.isActive = true')
            .andWhere('role.code = :roleCode', { roleCode: RoleCode.TEACHER });

        if (departmentId) {
            qb.andWhere('teacherProfile.departmentId = :departmentId', { departmentId });
        }

        const users = await qb.getMany();

        for (const user of users) {
            teachers.add(formatTeacherName(user));
        }
    }

    private async collectTeachersFromSchedule(
        teachers: Set<string>,
        departmentId?: number,
    ): Promise<void> {
        const qb = this.baseItemsQuery()
            .leftJoin('item.teacher', 'teacherUser')
            .leftJoin('teacherUser.teacherProfile', 'teacherProfile');

        if (departmentId) {
            qb.andWhere(
                'teacherUser.id IS NOT NULL AND teacherProfile.departmentId = :departmentId',
                { departmentId },
            );
        }

        const items = await qb.getMany();

        for (const item of items) {
            if (item.teacher) {
                teachers.add(formatTeacherName(item.teacher));
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

    async getTeacherSchedule(teacherName: string): Promise<TeacherScheduleResponse> {
        const normalizedTeacherName = this.normalizeText(teacherName);

        const items = await this.baseItemsQuery().getMany();
        const matchedItems = items.filter((item) => {
            const resolvedName = item.teacher
                ? formatTeacherName(item.teacher)
                : item.legacyTeacherName?.trim() ?? '';

            return this.normalizeText(resolvedName) === normalizedTeacherName;
        });

        const resolvedTeacherName = matchedItems[0]
            ? (matchedItems[0].teacher
                ? formatTeacherName(matchedItems[0].teacher)
                : matchedItems[0].legacyTeacherName?.trim() ?? teacherName.trim())
            : teacherName.trim();

        return {
            teacherName: resolvedTeacherName,
            weeks: await this.buildWeeksFromItems(matchedItems),
            ...resolveSchedulePeriodMeta(matchedItems),
        };
    }

    async listBuildings(): Promise<string[]> {
        const rooms = await this.listRooms();
        const buildings = new Set<string>();

        for (const room of rooms) {
            if (this.isDistanceRoom(room)) {
                buildings.add(DISTANCE_BUILDING);
            }

            if (this.isRomanRoomLabel(room)) {
                buildings.add(ROMAN_BUILDING);
            }

            const building = this.getBuildingFromRoom(room);
            if (building) {
                buildings.add(building);
            }
        }

        const standardBuildings = ['УК1', 'УК2', 'УК3', 'УК4', 'УК5'] as const;
        const ordered: string[] = standardBuildings.filter((building) => buildings.has(building));

        if (!ordered.includes(ROMAN_BUILDING)) {
            ordered.push(ROMAN_BUILDING);
        }

        if (!ordered.includes(DISTANCE_BUILDING)) {
            ordered.push(DISTANCE_BUILDING);
        }

        return ordered;
    }

    async listRooms(building?: string): Promise<string[]> {
        const items = await this.baseItemsQuery().getMany();
        const physicalRooms = new Map<string, string>();
        const distanceRooms = new Map<string, string>();

        for (const item of items) {
            const label = formatRoomLabel(item.room);
            if (!label) {
                continue;
            }

            for (const roomLabel of splitPhysicalRoomLabels(label)) {
                const roomKey = normalizeRoomListKey(roomLabel);

                if (this.isDistanceRoom(roomLabel)) {
                    const existing = distanceRooms.get(roomKey);
                    distanceRooms.set(
                        roomKey,
                        existing ? pickPreferredRoomLabel(existing, roomLabel) : roomLabel,
                    );
                } else {
                    const existing = physicalRooms.get(roomKey);
                    physicalRooms.set(
                        roomKey,
                        existing ? pickPreferredRoomLabel(existing, roomLabel) : roomLabel,
                    );
                }
            }
        }

        const sortRooms = (left: string, right: string) =>
            left.localeCompare(right, 'ru', { sensitivity: 'base', numeric: true });

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

        if (normalizedBuilding === ROMAN_BUILDING.toUpperCase()) {
            return Array.from(physicalRooms.values())
                .filter((room) => this.isRomanRoomLabel(room))
                .sort(sortRooms);
        }

        return Array.from(physicalRooms.values())
            .filter((room) =>
                this.getBuildingFromRoom(room)?.toUpperCase() === normalizedBuilding,
            )
            .sort(sortRooms);
    }

    async getRoomSchedule(roomName: string): Promise<RoomScheduleResponse> {
        const normalizedRoomName = normalizeRoomListKey(roomName);

        const items = await this.baseItemsQuery().getMany();
        const matchedItems = items.filter((item) =>
            splitPhysicalRoomLabels(formatRoomLabel(item.room))
                .some((label) => normalizeRoomListKey(label) === normalizedRoomName),
        );

        return {
            room: roomName.trim(),
            weeks: await this.buildWeeksFromItems(matchedItems),
            ...resolveSchedulePeriodMeta(matchedItems),
        };
    }
}
