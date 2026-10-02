import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Group, EducationForm } from '../academic/entities/group.entity';
import { Direction } from '../academic/entities/direction.entity';
import { Subject } from '../academic/entities/subject.entity';
import { Subgroup } from '../academic/entities/subgroup.entity';

import {
    CreateScheduleItemDto,
    ScheduleItemPreviewDto,
    ScheduleItemPreviewResultDto,
    ScheduleTransferRecommendationDto,
    UpdateScheduleItemDto,
} from './dto/schedule-item.dto';
import { Schedule } from './entities/schedule.entity';
import { ScheduleItem } from './entities/schedule-item.entity';
import { SchedulePreholidayDay } from './entities/schedule-preholiday-day.entity';
import { ScheduleDisplayLesson } from './schedule-display.service';
import {
    formatRoomLabel,
    mapItemToDisplayLesson,
    mapItemToLessonSlot,
    resolveTeacherName,
} from './schedule-item.mapper';
import { normalizeWeekStart, normalizeTime } from './parser/schedule-slot.utils';
import { isDistanceRoom, isSharedMultiHallRoom } from './parser/lesson-cell.parser';
import {
    assertParallelGroupSet,
    parseGroupNames,
} from './parser/group-parallel.utils';
import {
    ScheduleLessonSlot,
    validateScheduleConflicts,
} from './parser/schedule-conflict.validator';
import { LessonTypeCode } from './entities/lesson-type.entity';
import { LinkedLessonService } from './linked-lesson.service';
import { LessonTypeResolver } from './resolver/lesson-type.resolver';
import { RoomResolver } from './resolver/room.resolver';
import { TeacherResolver } from './resolver/teacher.resolver';
import { ScheduleNotifierService } from './schedule-notifier.service';
import { NotificationsService } from '../notifications/notifications.service';

const ITEM_RELATIONS = [
    'schedule',
    'schedule.group',
    'subject',
    'subgroup',
    'lessonType',
    'teacher',
    'room',
] as const;

const DAY_LABELS: Record<number, string> = {
    1: 'ПН',
    2: 'ВТ',
    3: 'СР',
    4: 'ЧТ',
    5: 'ПТ',
    6: 'СБ',
};

const WEEKDAY_TRANSFER_TIME_SLOTS = [
    { startTime: '08:30', endTime: '10:00' },
    { startTime: '10:15', endTime: '11:45' },
    { startTime: '12:00', endTime: '13:30' },
    { startTime: '14:15', endTime: '15:45' },
    { startTime: '16:00', endTime: '17:30' },
    { startTime: '17:40', endTime: '19:05' },
    { startTime: '19:15', endTime: '20:40' },
] as const;

const SATURDAY_TRANSFER_TIME_SLOTS = [
    { startTime: '08:30', endTime: '10:00' },
    { startTime: '10:15', endTime: '11:45' },
    { startTime: '12:00', endTime: '13:30' },
    { startTime: '13:45', endTime: '15:15' },
    { startTime: '15:30', endTime: '17:00' },
    { startTime: '17:10', endTime: '18:40' },
] as const;

const PREHOLIDAY_TRANSFER_TIME_SLOTS = [
    { startTime: '08:30', endTime: '10:00' },
    { startTime: '10:15', endTime: '11:45' },
    { startTime: '12:00', endTime: '13:30' },
    { startTime: '13:45', endTime: '14:45' },
    { startTime: '15:00', endTime: '16:00' },
] as const;

const PUBLIC_HOLIDAYS = new Set([
    '01-01',
    '01-02',
    '01-03',
    '01-04',
    '01-05',
    '01-06',
    '01-07',
    '01-08',
    '02-23',
    '03-08',
    '05-01',
    '05-09',
    '06-12',
    '11-04',
]);

interface ScoredTransferRecommendation extends ScheduleTransferRecommendationDto {
    score: number;
}

@Injectable()
export class ScheduleAdminService {
    private static readonly IMPORT_DIRECTION_CODE = 'SCHEDULE_IMPORT';

    constructor(
        @InjectRepository(ScheduleItem)
        private readonly itemsRepository: Repository<ScheduleItem>,
        @InjectRepository(Schedule)
        private readonly schedulesRepository: Repository<Schedule>,
        @InjectRepository(Group)
        private readonly groupsRepository: Repository<Group>,
        @InjectRepository(Direction)
        private readonly directionsRepository: Repository<Direction>,
        @InjectRepository(Subject)
        private readonly subjectsRepository: Repository<Subject>,
        @InjectRepository(Subgroup)
        private readonly subgroupsRepository: Repository<Subgroup>,
        @InjectRepository(SchedulePreholidayDay)
        private readonly preholidayDaysRepository: Repository<SchedulePreholidayDay>,
        private readonly roomResolver: RoomResolver,
        private readonly teacherResolver: TeacherResolver,
        private readonly lessonTypeResolver: LessonTypeResolver,
        private readonly scheduleNotifier: ScheduleNotifierService,
        private readonly notificationsService: NotificationsService,
        private readonly linkedLessonService: LinkedLessonService,
    ) {}

    private toDate(value: string): string {
        const trimmed = value.trim();

        if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
            return trimmed.slice(0, 10);
        }

        const [day, month, year] = trimmed.split('.');
        const pad = (part: string) => part.padStart(2, '0');

        return `${year}-${pad(month)}-${pad(day)}`;
    }

    private normalizeTeacherLabel(rawTeacherName?: string): string {
        const trimmed = rawTeacherName?.trim().replace(/\s+/g, ' ') ?? '';

        if (!trimmed) {
            return '';
        }

        const initialsMatch = trimmed.match(
            /^([A-Za-zА-ЯЁа-яё-]+)\s+([A-Za-zА-ЯЁ])\.?\s*([A-Za-zА-ЯЁ])\.?$/u,
        );

        if (initialsMatch) {
            const surname = initialsMatch[1];
            const nameInitial = initialsMatch[2].toUpperCase();
            const patronymicInitial = initialsMatch[3].toUpperCase();

            return `${surname} ${nameInitial}.${patronymicInitial}.`;
        }

        const compactInitialsMatch = trimmed.match(
            /^([A-Za-zА-ЯЁа-яё-]+)\s+([A-Za-zА-ЯЁ])\.?([A-Za-zА-ЯЁ])\.?$/u,
        );

        if (compactInitialsMatch) {
            const surname = compactInitialsMatch[1];
            const nameInitial = compactInitialsMatch[2].toUpperCase();
            const patronymicInitial = compactInitialsMatch[3].toUpperCase();

            return `${surname} ${nameInitial}.${patronymicInitial}.`;
        }

        const fullNameParts = trimmed.split(' ');
        if (fullNameParts.length >= 3) {
            const surname = fullNameParts[0];
            const nameInitial = fullNameParts[1].charAt(0).toUpperCase();
            const patronymicInitial = fullNameParts[2].charAt(0).toUpperCase();

            if (nameInitial && patronymicInitial) {
                return `${surname} ${nameInitial}.${patronymicInitial}.`;
            }
        }

        return trimmed;
    }

    private async findOrCreateImportDirection(): Promise<Direction> {
        let direction = await this.directionsRepository.findOne({
            where: { code: ScheduleAdminService.IMPORT_DIRECTION_CODE },
        });

        if (!direction) {
            direction = await this.directionsRepository.save(
                this.directionsRepository.create({
                    code: ScheduleAdminService.IMPORT_DIRECTION_CODE,
                    name: 'Импорт расписания',
                }),
            );
        }

        return direction;
    }

    private async findOrCreateGroup(groupName: string): Promise<Group> {
        const trimmed = groupName.trim();

        const existing = await this.groupsRepository
            .createQueryBuilder('group')
            .where('UPPER(TRIM(group.name)) = UPPER(:name)', { name: trimmed })
            .getOne();

        if (existing) {
            return existing;
        }

        const direction = await this.findOrCreateImportDirection();

        return this.groupsRepository.save(
            this.groupsRepository.create({
                name: trimmed,
                directionId: direction.id,
                course: 1,
                educationForm: EducationForm.FULL_TIME,
            }),
        );
    }

    private async findOrCreateSubject(name: string): Promise<Subject> {
        const trimmed = name.trim();

        let subject = await this.subjectsRepository.findOne({
            where: { name: trimmed },
        });

        if (!subject) {
            subject = await this.subjectsRepository.save(
                this.subjectsRepository.create({
                    name: trimmed,
                    description: null,
                }),
            );
        }

        return subject;
    }

    private async findSubgroup(
        groupId: number,
        number: number | null | undefined,
    ): Promise<Subgroup | null> {
        if (!number) {
            return null;
        }

        const subgroupNumber = number as 1 | 2;

        const existing = await this.subgroupsRepository.findOne({
            where: {
                groupId,
                number: subgroupNumber,
            },
        });

        if (existing) {
            return existing;
        }

        return this.subgroupsRepository.save(
            this.subgroupsRepository.create({
                groupId,
                number: subgroupNumber,
            }),
        );
    }

    private async findScheduleForWeek(
        groupName: string,
        weekStart: string,
    ): Promise<Schedule> {
        const weekStartIso = this.toDate(weekStart);
        const normalizedGroupName = groupName.trim();

        const scheduleInPeriod = await this.schedulesRepository
            .createQueryBuilder('schedule')
            .innerJoin('schedule.group', 'group')
            .where('UPPER(TRIM(group.name)) = UPPER(:groupName)', {
                groupName: normalizedGroupName,
            })
            .andWhere('schedule.isActive = true')
            .andWhere('schedule.validFrom <= :weekStart', { weekStart: weekStartIso })
            .andWhere('schedule.validTo >= :weekStart', { weekStart: weekStartIso })
            .orderBy('schedule.validFrom', 'DESC')
            .getOne();

        if (scheduleInPeriod) {
            return scheduleInPeriod;
        }

        const scheduleByExistingWeek = await this.schedulesRepository
            .createQueryBuilder('schedule')
            .innerJoin('schedule.group', 'group')
            .innerJoin('schedule.items', 'item')
            .where('UPPER(TRIM(group.name)) = UPPER(:groupName)', {
                groupName: normalizedGroupName,
            })
            .andWhere('schedule.isActive = true')
            .andWhere('item.isDisabled = false')
            .andWhere('item.weekStart = :weekStart', { weekStart: weekStartIso })
            .orderBy('schedule.validFrom', 'DESC')
            .getOne();

        if (scheduleByExistingWeek) {
            return scheduleByExistingWeek;
        }

        const activeSchedule = await this.schedulesRepository
            .createQueryBuilder('schedule')
            .innerJoin('schedule.group', 'group')
            .where('UPPER(TRIM(group.name)) = UPPER(:groupName)', {
                groupName: normalizedGroupName,
            })
            .andWhere('schedule.isActive = true')
            .orderBy('schedule.validFrom', 'DESC')
            .getOne();

        if (activeSchedule) {
            return activeSchedule;
        }

        throw new BadRequestException(
            'Расписание для этой группы и недели не найдено. Загрузите файл расписания.',
        );
    }

    private async loadItemWithRelations(id: number): Promise<ScheduleItem> {
        const item = await this.itemsRepository.findOne({
            where: { id },
            relations: [...ITEM_RELATIONS],
        });

        if (!item) {
            throw new NotFoundException('Занятие не найдено');
        }

        return item;
    }

    private async applySlotFields(
        item: ScheduleItem,
        slot: {
            subject: string;
            lessonType: string;
            teacherName?: string;
            room?: string;
            subgroup?: number | null;
            dayOfWeek?: number;
            startTime?: string;
            endTime?: string;
            weekStart?: string;
            comment?: string | null;
        },
        groupId: number,
        resolvedLessonType?: Awaited<ReturnType<LessonTypeResolver['resolve']>>,
    ): Promise<void> {
        const subject = await this.findOrCreateSubject(slot.subject);
        const lessonType = resolvedLessonType
            ?? await this.lessonTypeResolver.resolve(slot.lessonType);
        const room = slot.room?.trim()
            ? await this.roomResolver.resolve(slot.room)
            : null;
        const normalizedTeacherName = this.normalizeTeacherLabel(slot.teacherName);

        const teacher = normalizedTeacherName
            ? await this.teacherResolver.resolve(normalizedTeacherName)
            : null;

        const subgroup = await this.findSubgroup(groupId, slot.subgroup ?? null);

        item.subject = subject;
        item.lessonType = lessonType;
        item.room = room;
        item.teacher = teacher;
        item.subgroup = subgroup;
        item.subjectId = subject.id;
        item.lessonTypeId = lessonType.id;
        item.roomId = room?.id ?? null;
        item.teacherId = teacher?.id ?? null;
        item.subgroupId = subgroup?.id ?? null;
        item.legacyTeacherName = teacher ? null : (normalizedTeacherName || null);

        if (slot.dayOfWeek !== undefined) {
            item.dayOfWeek = slot.dayOfWeek;
        }

        if (slot.startTime !== undefined) {
            item.startTime = slot.startTime;
        }

        if (slot.endTime !== undefined) {
            item.endTime = slot.endTime;
        }

        if (slot.weekStart !== undefined) {
            item.weekStart = this.toDate(slot.weekStart);
        }

        if (slot.comment !== undefined) {
            item.comment = slot.comment;
        }
    }

    private async loadActiveLessonSlots(excludeItemIds: number[] = []) {
        const query = this.itemsRepository
            .createQueryBuilder('item')
            .innerJoinAndSelect('item.schedule', 'schedule')
            .innerJoinAndSelect('schedule.group', 'group')
            .leftJoinAndSelect('item.subject', 'subject')
            .leftJoinAndSelect('item.subgroup', 'subgroup')
            .leftJoinAndSelect('item.lessonType', 'lessonType')
            .leftJoinAndSelect('item.teacher', 'teacher')
            .leftJoinAndSelect('item.room', 'room')
            .where('item.isDisabled = false');

        if (excludeItemIds.length > 0) {
            query.andWhere('item.id NOT IN (:...excludeItemIds)', { excludeItemIds });
        }

        const items = await query.getMany();

        return items.map((entry) => mapItemToLessonSlot(entry));
    }

    private async assertNoConflicts(
        candidate: ScheduleItem,
        excludeItemIds: number[] = [],
    ): Promise<void> {
        const existingLessons = await this.loadActiveLessonSlots(excludeItemIds);
        const candidateSlot = mapItemToLessonSlot(candidate);
        const conflicts = this.getCandidateConflicts(candidateSlot, existingLessons);

        if (conflicts.length === 0) {
            return;
        }

        throw new BadRequestException({
            message: 'Невозможно сохранить: обнаружен конфликт в расписании',
            errors: conflicts.map((conflict) => conflict.message),
        });
    }

    private getCandidateConflicts(
        candidate: ScheduleLessonSlot,
        existingLessons: ScheduleLessonSlot[],
    ): ReturnType<typeof validateScheduleConflicts> {
        return validateScheduleConflicts([candidate], existingLessons)
            .filter((conflict) =>
                conflict.lessonA === candidate || conflict.lessonB === candidate,
            );
    }

    private async findLinkedLectureItems(item: ScheduleItem): Promise<ScheduleItem[]> {
        return this.linkedLessonService.findLinkedSharedLessonItems(item);
    }

    private buildUpdateSlotFields(
        item: ScheduleItem,
        dto: UpdateScheduleItemDto | ScheduleItemPreviewDto,
    ) {
        return {
            subject: dto.subject?.trim() ?? item.subject.name,
            lessonType: dto.lessonType?.trim() ?? item.lessonType.name,
            teacherName: dto.teacherName !== undefined
                ? dto.teacherName.trim()
                : resolveTeacherName(item),
            room: dto.room !== undefined
                ? dto.room.trim()
                : formatRoomLabel(item.room),
            subgroup: dto.subgroup !== undefined
                ? dto.subgroup
                : (item.subgroup?.number ?? null),
            dayOfWeek: dto.dayOfWeek ?? item.dayOfWeek,
            startTime: dto.startTime ?? item.startTime,
            endTime: dto.endTime ?? item.endTime,
            weekStart: dto.weekStart ?? normalizeWeekStart(String(item.weekStart)),
            comment: 'comment' in dto && dto.comment !== undefined
                ? (dto.comment?.trim() || null)
                : undefined,
        };
    }

    private buildLessonSlotFromFields(
        item: ScheduleItem,
        fields: ReturnType<ScheduleAdminService['buildUpdateSlotFields']>,
    ): ScheduleLessonSlot {
        const groupName = item.schedule?.group?.name ?? '';
        const room = fields.room?.trim() || null;

        return {
            groupName,
            dayOfWeek: fields.dayOfWeek,
            startTime: normalizeTime(fields.startTime),
            endTime: normalizeTime(fields.endTime),
            weekStart: normalizeWeekStart(fields.weekStart),
            subgroup: fields.subgroup,
            isDistance: isDistanceRoom(room),
            isSameCellParallel: item.isSameCellParallel,
            isSharedMultiHall: isSharedMultiHallRoom(room),
            subject: fields.subject,
            lessonType: fields.lessonType,
            teacherPosition: item.teacherPosition ?? '',
            teacherName: fields.teacherName,
            room,
        };
    }

    private isConflictAtTargetSlot(
        conflict: ReturnType<typeof validateScheduleConflicts>[number],
        target: ScheduleLessonSlot,
    ): boolean {
        const matchesTarget = (lesson: ScheduleLessonSlot) =>
            lesson.dayOfWeek === target.dayOfWeek
            && normalizeTime(lesson.startTime) === normalizeTime(target.startTime)
            && normalizeWeekStart(lesson.weekStart) === normalizeWeekStart(target.weekStart);

        return matchesTarget(conflict.lessonA) || matchesTarget(conflict.lessonB);
    }

    private buildTransferRecommendations(
        sourceSlot: ScheduleLessonSlot,
        linkedSlots: ScheduleLessonSlot[],
        existingLessons: ScheduleLessonSlot[],
        preholidayDayKeys: Set<string>,
        targetWeekStart: string,
    ): ScheduleTransferRecommendationDto[] {
        const recommendations: ScoredTransferRecommendation[] = [];

        for (const [dayOfWeekValue, dayLabel] of Object.entries(DAY_LABELS)) {
            const dayOfWeek = Number(dayOfWeekValue);
            const dateKey = this.getDateKey(targetWeekStart, dayOfWeek);
            const isPreholidayDay = Boolean(dateKey && preholidayDayKeys.has(dateKey));

            if (this.isPublicHoliday(targetWeekStart, dayOfWeek)) {
                continue;
            }

            for (const slot of this.getRecommendationSlots(
                targetWeekStart,
                dayOfWeek,
                preholidayDayKeys,
            )) {
                const candidates = linkedSlots.map((linkedSlot) => this.buildCandidateSlot(
                    linkedSlot,
                    targetWeekStart,
                    dayOfWeek,
                    slot.startTime,
                    slot.endTime,
                ));

                const isOriginalSlot = candidates.some((candidate) =>
                    sourceSlot.weekStart === candidate.weekStart
                    && sourceSlot.dayOfWeek === candidate.dayOfWeek
                    && sourceSlot.startTime === candidate.startTime,
                );

                if (isOriginalSlot) {
                    continue;
                }

                const hasConflict = candidates.some((candidate) =>
                    this.getCandidateConflicts(candidate, existingLessons).length > 0,
                );

                if (hasConflict) {
                    continue;
                }

                const candidate = candidates.find((entry) => entry.groupName === sourceSlot.groupName)
                    ?? candidates[0];

                const { score, reasons } = this.scoreRecommendation(
                    candidate,
                    sourceSlot,
                    existingLessons,
                );
                const recommendationReasons = isPreholidayDay
                    ? [...reasons, 'предпраздничный день (короткие пары)']
                    : reasons;

                recommendations.push({
                    weekStart: targetWeekStart,
                    dayOfWeek,
                    day: dayLabel,
                    startTime: candidate.startTime,
                    endTime: candidate.endTime,
                    label: `${dayLabel}, ${candidate.startTime} - ${candidate.endTime}`,
                    reasons: recommendationReasons,
                    score,
                });
            }
        }

        return recommendations
            .sort((left, right) => {
                if (right.score !== left.score) {
                    return right.score - left.score;
                }

                if (left.dayOfWeek !== right.dayOfWeek) {
                    return left.dayOfWeek - right.dayOfWeek;
                }

                return left.startTime.localeCompare(right.startTime);
            })
            .slice(0, 5)
            .map((recommendation) => ({
                weekStart: recommendation.weekStart,
                dayOfWeek: recommendation.dayOfWeek,
                day: recommendation.day,
                startTime: recommendation.startTime,
                endTime: recommendation.endTime,
                label: recommendation.label,
                reasons: recommendation.reasons,
            }));
    }

    async previewItemChanges(
        id: number,
        dto: ScheduleItemPreviewDto,
    ): Promise<ScheduleItemPreviewResultDto> {
        const item = await this.loadItemWithRelations(id);
        const linkedItems = await this.findLinkedLectureItems(item);
        const linkedItemIds = linkedItems.map((entry) => entry.id);
        const existingLessons = await this.loadActiveLessonSlots(linkedItemIds);

        const conflictMessages: string[] = [];

        for (const linkedItem of linkedItems) {
            const slotFields = this.buildUpdateSlotFields(linkedItem, dto);
            const proposedSlot = this.buildLessonSlotFromFields(linkedItem, slotFields);
            const conflicts = this.getCandidateConflicts(proposedSlot, existingLessons)
                .filter((conflict) => this.isConflictAtTargetSlot(conflict, proposedSlot));
            conflictMessages.push(...conflicts.map((conflict) => conflict.message));
        }

        const uniqueConflicts = [...new Set(conflictMessages)];

        if (uniqueConflicts.length === 0) {
            return {
                conflicts: [],
                recommendations: [],
            };
        }

        const sourceItem = linkedItems.find((entry) => entry.id === id) ?? item;
        const sourceFields = this.buildUpdateSlotFields(sourceItem, dto);
        // Keep the real slot as the scoring baseline. The proposed fields are
        // used for candidate conflicts, but must not replace the original day
        // and time when ranking alternatives.
        const sourceSlot = mapItemToLessonSlot(sourceItem);
        const targetWeekStart = normalizeWeekStart(sourceFields.weekStart);

        if (this.isWeekInPast(targetWeekStart)) {
            return {
                conflicts: uniqueConflicts,
                recommendations: [],
            };
        }

        const linkedSlots = linkedItems.map((linkedItem) =>
            this.buildLessonSlotFromFields(
                linkedItem,
                this.buildUpdateSlotFields(linkedItem, dto),
            ),
        );
        const preholidayDayKeys = await this.loadPreholidayDayKeys(targetWeekStart);
        const recommendations = this.buildTransferRecommendations(
            sourceSlot,
            linkedSlots,
            existingLessons,
            preholidayDayKeys,
            targetWeekStart,
        );

        return {
            conflicts: uniqueConflicts,
            recommendations,
        };
    }

    private parseRecommendationDate(weekStart: string, dayOfWeek: number): Date | null {
        const normalizedWeekStart = normalizeWeekStart(weekStart);
        const [day, month, year] = normalizedWeekStart.split('.');

        if (!day || !month || !year) {
            return null;
        }

        const date = new Date(Number(year), Number(month) - 1, Number(day));
        if (Number.isNaN(date.getTime())) {
            return null;
        }

        date.setDate(date.getDate() + dayOfWeek - 1);
        date.setHours(0, 0, 0, 0);

        return date;
    }

    private isPublicHoliday(weekStart: string, dayOfWeek: number): boolean {
        const date = this.parseRecommendationDate(weekStart, dayOfWeek);

        if (!date) {
            return false;
        }

        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return PUBLIC_HOLIDAYS.has(`${month}-${day}`);
    }

    private isWeekInPast(weekStart: string): boolean {
        const normalizedWeekStart = normalizeWeekStart(this.toDate(weekStart));
        const [day, month, year] = normalizedWeekStart.split('.');

        if (!day || !month || !year) {
            return false;
        }

        const weekStartDate = new Date(Number(year), Number(month) - 1, Number(day));
        if (Number.isNaN(weekStartDate.getTime())) {
            return false;
        }

        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekEndDate.getDate() + 6);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        weekEndDate.setHours(0, 0, 0, 0);

        return weekEndDate < today;
    }

    private getDateKey(weekStart: string, dayOfWeek: number): string {
        const date = this.parseRecommendationDate(weekStart, dayOfWeek);

        if (!date) {
            return '';
        }

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${year}-${month}-${day}`;
    }

    private async loadPreholidayDayKeys(weekStart: string): Promise<Set<string>> {
        const weekStartDate = this.parseRecommendationDate(weekStart, 1);

        if (!weekStartDate) {
            return new Set();
        }

        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekEndDate.getDate() + 6);

        const toIso = (date: Date) => {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();

            return `${year}-${month}-${day}`;
        };

        const days = await this.preholidayDaysRepository
            .createQueryBuilder('preholiday')
            .where('preholiday.date >= :from', { from: toIso(weekStartDate) })
            .andWhere('preholiday.date <= :to', { to: toIso(weekEndDate) })
            .getMany();

        return new Set(days.map((day) => day.date));
    }

    private getRecommendationSlots(
        weekStart: string,
        dayOfWeek: number,
        preholidayDayKeys: Set<string>,
    ) {
        const dateKey = this.getDateKey(weekStart, dayOfWeek);
        if (dateKey && preholidayDayKeys.has(dateKey)) {
            return PREHOLIDAY_TRANSFER_TIME_SLOTS;
        }

        return dayOfWeek === 6
            ? SATURDAY_TRANSFER_TIME_SLOTS
            : WEEKDAY_TRANSFER_TIME_SLOTS;
    }

    private getBaseSlotsForDay(dayOfWeek: number) {
        return dayOfWeek === 6
            ? SATURDAY_TRANSFER_TIME_SLOTS
            : WEEKDAY_TRANSFER_TIME_SLOTS;
    }

    private getOriginalTimeIndex(source: ScheduleLessonSlot): number {
        const originalSlots = source.dayOfWeek === 6
            ? SATURDAY_TRANSFER_TIME_SLOTS
            : WEEKDAY_TRANSFER_TIME_SLOTS;

        return originalSlots.findIndex((slot) => slot.startTime === source.startTime);
    }

    private scoreDayLoadWithCandidate(
        candidate: ScheduleLessonSlot,
        sameGroupDayLessons: ScheduleLessonSlot[],
    ): { score: number; reason?: string } {
        if (sameGroupDayLessons.length === 0) {
            return { score: 6, reason: 'день у группы свободный' };
        }

        const allTimes = [...sameGroupDayLessons.map((lesson) => lesson.startTime), candidate.startTime]
            .map((time) => this.getMinutes(time))
            .sort((left, right) => left - right);

        let longBreaks = 0;
        for (let index = 1; index < allTimes.length; index += 1) {
            if ((allTimes[index] - allTimes[index - 1]) > 120) {
                longBreaks += 1;
            }
        }

        if (longBreaks === 0) {
            return { score: 14, reason: 'без длинных окон у группы' };
        }

        if (longBreaks === 1) {
            return { score: 6, reason: 'одно окно у группы' };
        }

        return { score: -8, reason: 'создаёт несколько окон у группы' };
    }

    private scoreTeacherLoad(
        candidate: ScheduleLessonSlot,
        sameTeacherDayLessons: ScheduleLessonSlot[],
    ): { score: number; reason?: string } {
        if (!candidate.teacherName) {
            return { score: 0 };
        }

        if (sameTeacherDayLessons.length === 0) {
            return { score: 0 };
        }

        const candidateMinutes = this.getMinutes(candidate.startTime);
        const nearestDistance = sameTeacherDayLessons
            .map((lesson) => Math.abs(this.getMinutes(lesson.startTime) - candidateMinutes))
            .sort((left, right) => left - right)[0] ?? 9999;

        if (nearestDistance <= 120) {
            return { score: 10, reason: 'преподавателю удобно по расписанию дня' };
        }

        return { score: 3, reason: 'преподаватель уже работает в этот день' };
    }

    private getMinutes(time: string): number {
        const [hours, minutes] = time.split(':').map(Number);

        return (hours * 60) + minutes;
    }

    private scoreRecommendation(
        candidate: ScheduleLessonSlot,
        source: ScheduleLessonSlot,
        existingLessons: ScheduleLessonSlot[],
    ): { score: number; reasons: string[] } {
        let score = 0;
        const reasons: string[] = ['нет конфликтов по группе, преподавателю и аудитории'];

        if (candidate.dayOfWeek === source.dayOfWeek) {
            score += 30;
            reasons.push('тот же день недели');
        }

        if (candidate.startTime === source.startTime) {
            score += 20;
            reasons.push('то же время пары');
        }

        const originalTimeIndex = this.getOriginalTimeIndex(source);
        const candidateTimeIndex = this.getBaseSlotsForDay(candidate.dayOfWeek)
            .findIndex((slot) => slot.startTime === candidate.startTime);

        if (originalTimeIndex !== -1 && candidateTimeIndex !== -1) {
            const distance = Math.abs(originalTimeIndex - candidateTimeIndex);
            if (distance === 0) {
                score += 10;
            } else if (distance === 1) {
                score += 5;
                reasons.push('близко к исходной паре');
            } else if (distance >= 3) {
                score -= 4;
                reasons.push('далеко от исходной пары');
            }
        }

        if (candidate.dayOfWeek === 6) {
            score -= 10;
            reasons.push('суббота');
        } else {
            score += 8;
        }

        const sameGroupDayLessons = existingLessons.filter((lesson) =>
            lesson.groupName === candidate.groupName
            && lesson.weekStart === candidate.weekStart
            && lesson.dayOfWeek === candidate.dayOfWeek,
        );
        const groupDayScore = this.scoreDayLoadWithCandidate(candidate, sameGroupDayLessons);
        score += groupDayScore.score;
        if (groupDayScore.reason) {
            reasons.push(groupDayScore.reason);
        }

        const sameTeacherDayLessons = existingLessons.filter((lesson) =>
            lesson.teacherName
            && lesson.teacherName === candidate.teacherName
            && lesson.weekStart === candidate.weekStart
            && lesson.dayOfWeek === candidate.dayOfWeek,
        );

        const teacherScore = this.scoreTeacherLoad(candidate, sameTeacherDayLessons);
        score += teacherScore.score;
        if (teacherScore.reason) {
            reasons.push(teacherScore.reason);
        }

        if (candidate.startTime <= '16:00') {
            score += 8;
        } else if (candidate.startTime < '17:40') {
            score += 3;
        } else {
            score -= 6;
            reasons.push('поздняя пара');
        }

        if (candidate.weekStart !== source.weekStart) {
            score -= 3;
            reasons.push('другая неделя');
        }

        return { score, reasons };
    }

    private buildCandidateSlot(
        source: ScheduleLessonSlot,
        weekStart: string,
        dayOfWeek: number,
        startTime: string,
        endTime: string,
    ): ScheduleLessonSlot {
        return {
            ...source,
            weekStart,
            dayOfWeek,
            startTime,
            endTime,
        };
    }

    async getTransferRecommendations(
        id: number,
        weekStart?: string,
    ): Promise<ScheduleTransferRecommendationDto[]> {
        const item = await this.loadItemWithRelations(id);
        const linkedItems = await this.findLinkedLectureItems(item);
        const linkedItemIds = linkedItems.map((entry) => entry.id);
        const linkedSlots = linkedItems.map((entry) => mapItemToLessonSlot(entry));
        const sourceSlot = linkedSlots.find((slot) => slot.groupName === item.schedule.group?.name)
            ?? mapItemToLessonSlot(item);
        const targetWeekStart = normalizeWeekStart(
            weekStart ? this.toDate(weekStart) : String(item.weekStart),
        );

        if (this.isWeekInPast(targetWeekStart)) {
            return [];
        }

        const existingLessons = await this.loadActiveLessonSlots(linkedItemIds);
        const preholidayDayKeys = await this.loadPreholidayDayKeys(targetWeekStart);

        return this.buildTransferRecommendations(
            sourceSlot,
            linkedSlots,
            existingLessons,
            preholidayDayKeys,
            targetWeekStart,
        );
    }

    async getLinkedGroupNames(id: number): Promise<string[]> {
        const item = await this.loadItemWithRelations(id);
        const linkedItems = await this.linkedLessonService.findLinkedSharedLessonItems(item);

        return linkedItems
            .map((entry) => entry.schedule?.group?.name ?? '')
            .filter(Boolean)
            .sort((left, right) =>
                left.localeCompare(right, 'ru', { sensitivity: 'base', numeric: true }),
            );
    }

    async createItem(dto: CreateScheduleItemDto): Promise<ScheduleDisplayLesson> {
        const groupNames = parseGroupNames(dto.groupName);

        if (groupNames.length === 0) {
            throw new BadRequestException('Укажите группу');
        }

        const lessonType = await this.lessonTypeResolver.resolve(dto.lessonType);
        const allowsMultipleGroups = lessonType.code === LessonTypeCode.LECTURE
            || lessonType.code === LessonTypeCode.SPECIAL;

        if (groupNames.length > 1 && !allowsMultipleGroups) {
            throw new BadRequestException(
                'Несколько групп можно указать только для лекций и занятий типа «Особое»',
            );
        }

        if (lessonType.code === LessonTypeCode.LECTURE) {
            try {
                assertParallelGroupSet(groupNames);
            } catch (error) {
                throw new BadRequestException(
                    error instanceof Error
                        ? error.message
                        : 'Группы для лекции должны быть параллельными',
                );
            }
        }

        let firstCreatedItem: ScheduleDisplayLesson | null = null;

        for (const groupName of groupNames) {
            const createdItem = await this.createItemForGroup(
                {
                    ...dto,
                    groupName,
                },
                lessonType,
            );

            if (!firstCreatedItem) {
                firstCreatedItem = createdItem;
            }
        }

        return firstCreatedItem!;
    }

    private async createItemForGroup(
        dto: CreateScheduleItemDto,
        resolvedLessonType?: Awaited<ReturnType<LessonTypeResolver['resolve']>>,
    ): Promise<ScheduleDisplayLesson> {
        const group = await this.findOrCreateGroup(dto.groupName);
        const schedule = await this.findScheduleForWeek(dto.groupName, dto.weekStart);

        const item = this.itemsRepository.create({
            scheduleId: schedule.id,
            dayOfWeek: dto.dayOfWeek,
            startTime: dto.startTime,
            endTime: dto.endTime,
            weekStart: this.toDate(dto.weekStart),
            isDisabled: false,
            isSameCellParallel: false,
            teacherPosition: null,
            weekType: null,
            comment: dto.comment?.trim() || null,
        });

        await this.applySlotFields(item, dto, group.id, resolvedLessonType);
        item.schedule = schedule;
        item.schedule.group = group;

        await this.assertNoConflicts(item);

        const saved = await this.itemsRepository.save(item);
        const savedWithRelations = await this.loadItemWithRelations(saved.id);

        this.scheduleNotifier.notifyScheduleChanged(
            'item-created',
            this.scheduleNotifier.getTargetsForItems([savedWithRelations]),
        );
        await this.notificationsService.notifyScheduleItemChanged('created', savedWithRelations);

        return mapItemToDisplayLesson(savedWithRelations);
    }

    async updateItem(
        id: number,
        dto: UpdateScheduleItemDto,
    ): Promise<ScheduleDisplayLesson> {
        const item = await this.loadItemWithRelations(id);
        const linkedItems = await this.findLinkedLectureItems(item);
        const linkedItemIds = linkedItems.map((entry) => entry.id);
        const previousTargets = this.scheduleNotifier.getTargetsForItems(linkedItems);
        const snapshots = new Map(
            linkedItems.map((linkedItem) => [
                linkedItem.id,
                this.notificationsService.createScheduleItemSnapshot(linkedItem),
            ]),
        );

        const groupName = item.schedule.group?.name;

        if (!groupName) {
            throw new BadRequestException('У занятия не указана группа');
        }

        const currentWeekStart = normalizeWeekStart(String(item.weekStart));
        const nextWeekStart = dto.weekStart !== undefined
            ? normalizeWeekStart(this.toDate(dto.weekStart))
            : currentWeekStart;

        if (this.isWeekInPast(nextWeekStart) && nextWeekStart !== currentWeekStart) {
            throw new BadRequestException('Нельзя перенести пару на прошедшую неделю');
        }

        const slotFields = this.buildUpdateSlotFields(item, dto);

        for (const linkedItem of linkedItems) {
            await this.applySlotFields(
                linkedItem,
                slotFields,
                linkedItem.schedule.groupId!,
            );
        }

        for (const linkedItem of linkedItems) {
            await this.assertNoConflicts(linkedItem, linkedItemIds);
        }

        for (const linkedItem of linkedItems) {
            await this.itemsRepository.save(linkedItem);
        }

        this.scheduleNotifier.notifyScheduleChanged(
            'item-updated',
            [...previousTargets, ...this.scheduleNotifier.getTargetsForItems(linkedItems)],
        );

        for (const linkedItem of linkedItems) {
            const updatedWithRelations = await this.loadItemWithRelations(linkedItem.id);
            const previousItem = snapshots.get(linkedItem.id);

            if (previousItem) {
                await this.notificationsService.notifyScheduleItemChanged(
                    'updated',
                    updatedWithRelations,
                    previousItem,
                );
            }
        }

        return mapItemToDisplayLesson(await this.loadItemWithRelations(id));
    }

    async disableItem(id: number): Promise<void> {
        const item = await this.loadItemWithRelations(id);
        const linkedItems = await this.findLinkedLectureItems(item);
        const targets = this.scheduleNotifier.getTargetsForItems(linkedItems);

        for (const linkedItem of linkedItems) {
            linkedItem.isDisabled = true;
            await this.itemsRepository.save(linkedItem);
        }

        this.scheduleNotifier.notifyScheduleChanged('item-disabled', targets);

        for (const linkedItem of linkedItems) {
            const disabledWithRelations = await this.loadItemWithRelations(linkedItem.id);
            await this.notificationsService.notifyScheduleItemChanged(
                'disabled',
                disabledWithRelations,
            );
        }
    }

    async deleteItem(id: number): Promise<void> {
        const item = await this.loadItemWithRelations(id);
        const linkedItems = await this.findLinkedLectureItems(item);
        const targets = this.scheduleNotifier.getTargetsForItems(linkedItems);

        await this.itemsRepository.delete(id);

        this.scheduleNotifier.notifyScheduleChanged('item-deleted', targets);
        await this.notificationsService.notifyScheduleItemChanged('deleted', item);
    }
}