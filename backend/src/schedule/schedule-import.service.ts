import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Group, EducationForm } from '../academic/entities/group.entity';
import { Subject } from '../academic/entities/subject.entity';
import { Subgroup } from '../academic/entities/subgroup.entity';

import { ParseScheduleResult } from './parser/excel-grid.parser';
import { ScheduleLessonSlot } from './parser/schedule-conflict.validator';

import { Schedule, ScheduleType } from './entities/schedule.entity';
import { ScheduleItem } from './entities/schedule-item.entity';
import { ScheduleUpload } from './entities/schedule-upload.entity';

import { RoomResolver } from './resolver/room.resolver';
import { TeacherResolver } from './resolver/teacher.resolver';
import { LessonTypeResolver } from './resolver/lesson-type.resolver';

@Injectable()
export class ScheduleImportService {
    constructor(
        @InjectRepository(Schedule)
        private readonly schedulesRepository: Repository<Schedule>,

        @InjectRepository(ScheduleItem)
        private readonly itemsRepository: Repository<ScheduleItem>,

        @InjectRepository(Group)
        private readonly groupsRepository: Repository<Group>,

        @InjectRepository(Subject)
        private readonly subjectsRepository: Repository<Subject>,

        @InjectRepository(Subgroup)
        private readonly subgroupsRepository: Repository<Subgroup>,

        private readonly roomResolver: RoomResolver,
        private readonly teacherResolver: TeacherResolver,
        private readonly lessonTypeResolver: LessonTypeResolver,
    ) {}

    private async findOrCreateGroup(groupName: string): Promise<Group> {
        const trimmed = groupName.trim();

        const existing = await this.groupsRepository.findOne({
            where: { name: trimmed },
        });

        if (existing) {
            return existing;
        }

        return this.groupsRepository.save(
            this.groupsRepository.create({
                name: trimmed,
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
        number: number | null,
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

    private toDate(value: string): string {
        const [day, month, year] = value.split('.');
        const pad = (part: string) => part.padStart(2, '0');

        return `${year}-${pad(month)}-${pad(day)}`;
    }

    private dedupeWarnings(warnings: string[]): string[] {
        return [...new Set(warnings)];
    }

    static isImportResolvableWarning(warning: string): boolean {
        return warning.startsWith('Преподаватель не найден в БД:')
            || warning.startsWith('Подгруппа ');
    }

    static mergeStoredWarnings(
        stored: string[] | null,
        importWarnings: string[],
    ): string[] {
        const staticWarnings = (stored ?? []).filter(
            (warning) => !ScheduleImportService.isImportResolvableWarning(warning),
        );

        return ScheduleImportService.dedupeWarningsStatic([
            ...staticWarnings,
            ...importWarnings,
        ]);
    }

    private static dedupeWarningsStatic(warnings: string[]): string[] {
        return [...new Set(warnings)];
    }

    async refreshUploadReferences(uploadId: number): Promise<string[]> {
        const schedule = await this.schedulesRepository.findOne({
            where: { uploadId },
            relations: ['items', 'items.subject', 'group'],
        });

        if (!schedule) {
            return [];
        }

        const importWarnings: string[] = [];

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
                } else {
                    importWarnings.push(
                        `Преподаватель не найден в БД: ${item.legacyTeacherName} (${item.subject.name})`,
                    );
                }
            }
        }

        return this.dedupeWarnings(importWarnings);
    }

    async importParsedSchedule(
        parsed: ParseScheduleResult,
        upload: ScheduleUpload,
    ): Promise<{
        scheduleId: number;
        itemsCount: number;
        warnings: string[];
    }> {
        if (!parsed.periodStart || !parsed.periodEnd) {
            throw new BadRequestException(
                'В файле не указан период расписания',
            );
        }

        const warnings: string[] = [...parsed.warnings];

        // ---------------------------------------------------------
        // 1. Получение группы
        // ---------------------------------------------------------

        const group = await this.findOrCreateGroup(parsed.groupName);

        const validFrom = this.toDate(parsed.periodStart);
        const validTo = this.toDate(parsed.periodEnd);

        // ---------------------------------------------------------
        // 2. Поиск существующего расписания
        // ---------------------------------------------------------

        let schedule = await this.schedulesRepository.findOne({
            where: {
                scheduleType: ScheduleType.STUDENT,
                groupId: group.id,
                validFrom,
                validTo,
            },
        });

        // ---------------------------------------------------------
        // 3. Обновление или создание расписания
        // ---------------------------------------------------------

        if (schedule) {
            await this.itemsRepository.delete({
                scheduleId: schedule.id,
            });

            schedule.uploadId = upload.id;
            schedule.isActive = true;

            schedule = await this.schedulesRepository.save(schedule);
        } else {
            schedule = await this.schedulesRepository.save(
                this.schedulesRepository.create({
                    scheduleType: ScheduleType.STUDENT,
                    groupId: group.id,
                    teacherId: null,
                    uploadId: upload.id,
                    validFrom,
                    validTo,
                    isActive: true,
                }),
            );
        }

        // ---------------------------------------------------------
        // 4. Предзагрузка предметов
        // ---------------------------------------------------------
                const uniqueSubjects = [
                    ...new Set(parsed.lessons.map((lesson) => lesson.subject.trim())),
                ];

                const subjectEntries = await Promise.all(
                    uniqueSubjects.map(async (subjectName) => {
                        const subject = await this.findOrCreateSubject(subjectName);
                        return [subjectName, subject] as const;
                    }),
                );
                const subjectMap = new Map(subjectEntries);

        // ---------------------------------------------------------
        // 5. Предзагрузка преподавателей
        // ---------------------------------------------------------
                const uniqueTeachers = [
                    ...new Set(
                        parsed.lessons
                            .map((lesson) => lesson.teacherName?.trim())
                            .filter((teacherName): teacherName is string => Boolean(teacherName)),
                    ),
                ];

                const teacherEntries = await Promise.all(
                    uniqueTeachers.map(async (teacherName) => {
                        const teacher = await this.teacherResolver.resolve(teacherName);
                        return [teacherName, teacher] as const;
                    }),
                );
                const teacherMap = new Map(teacherEntries);

        // ---------------------------------------------------------
        // 6. Предзагрузка аудиторий
        // ---------------------------------------------------------
                const uniqueRooms = [
                    ...new Set(
                        parsed.lessons
                            .map((lesson) => lesson.room?.trim())
                            .filter((roomName): roomName is string => Boolean(roomName)),
                    ),
                ];

                const roomEntries = await Promise.all(
                    uniqueRooms.map(async (roomName) => {
                        const room = await this.roomResolver.resolve(roomName);
                        return [roomName, room] as const;
                    }),
                );
                const roomMap = new Map(roomEntries);

        // ---------------------------------------------------------
        // 7. Предзагрузка типов занятий
        // ---------------------------------------------------------
                const uniqueLessonTypes = [
                    ...new Set(
                        parsed.lessons
                            .map((lesson) => lesson.lessonType.trim())
                            .filter((lessonType): lessonType is string => Boolean(lessonType)),
                    ),
                ];

                const lessonTypeEntries = await Promise.all(
                    uniqueLessonTypes.map(async (lessonTypeName) => {
                        const lessonType = await this.lessonTypeResolver.resolve(lessonTypeName);
                        return [lessonTypeName, lessonType] as const;
                    }),
                );
                const lessonTypeMap = new Map(lessonTypeEntries);

        // ---------------------------------------------------------
        // 8. Предзагрузка подгрупп
        // ---------------------------------------------------------
                const uniqueSubgroups = [
                    ...new Set(parsed.lessons.map((lesson) => lesson.subgroup)),
                ];

                const subgroupEntries = await Promise.all(
                    uniqueSubgroups.map(async (subgroupNumber) => {
                        const subgroup = await this.findSubgroup(group.id, subgroupNumber);
                        return [subgroupNumber, subgroup] as const;
                    }),
                );
                const subgroupMap = new Map(subgroupEntries);

        // ---------------------------------------------------------
        // 9. Создание ScheduleItem в памяти
        // ---------------------------------------------------------

        const itemsToInsert: ScheduleItem[] = [];

        for (const slot of parsed.lessons) {
            // Предмет
            const subjectName = slot.subject.trim();
            const subject = subjectMap.get(subjectName);

            if (!subject) {
                throw new BadRequestException(
                    `Не найден предмет: ${slot.subject}`,
                );
            }

            // Тип занятия
            const lessonTypeName = slot.lessonType.trim();
            const lessonType = lessonTypeMap.get(lessonTypeName);

            if (!lessonType) {
                throw new BadRequestException(
                    `Не найден тип занятия: ${slot.lessonType}`,
                );
            }

            // Аудитория
            const roomName = slot.room?.trim() ?? '';

            const room = roomName
                ? roomMap.get(roomName) ?? null
                : null;

            // Преподаватель
            const teacherName = slot.teacherName?.trim() ?? '';

            const teacher = teacherName
                ? teacherMap.get(teacherName) ?? null
                : null;

            if (teacherName && !teacher) {
                warnings.push(
                    `Преподаватель не найден в БД: ${slot.teacherName} (${slot.subject})`,
                );
            }

            // Подгруппа
            const subgroup = subgroupMap.get(slot.subgroup) ?? null;

            // Создание занятия
            const item = this.itemsRepository.create({
                scheduleId: schedule.id,
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

            itemsToInsert.push(item);
        }

        // ---------------------------------------------------------
        // 10. Массовое добавление занятий (чанками)
        // ---------------------------------------------------------
                const CHUNK_SIZE = 200;

                if (itemsToInsert.length > 0) {
                    for (let i = 0; i < itemsToInsert.length; i += CHUNK_SIZE) {
                        const chunk = itemsToInsert.slice(i, i + CHUNK_SIZE);
                        await this.itemsRepository.insert(chunk);
                    }
                }

        // ---------------------------------------------------------
        // 11. Возврат результата
        // ---------------------------------------------------------

        return {
            scheduleId: schedule.id,
            itemsCount: itemsToInsert.length,
            warnings: this.dedupeWarnings(warnings),
        };
    }

    private async mapSlotToItem(
        slot: ScheduleLessonSlot,
        scheduleId: number,
        groupId: number,
        warnings: string[],
    ): Promise<ScheduleItem | null> {
        const subject = await this.findOrCreateSubject(slot.subject);
        const lessonType = await this.lessonTypeResolver.resolve(slot.lessonType);
        const room = await this.roomResolver.resolve(slot.room);

        const teacher = slot.teacherName
            ? await this.teacherResolver.resolve(slot.teacherName)
            : null;

        if (slot.teacherName && !teacher) {
            warnings.push(
                `Преподаватель не найден в БД: ${slot.teacherName} (${slot.subject})`,
            );
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
}