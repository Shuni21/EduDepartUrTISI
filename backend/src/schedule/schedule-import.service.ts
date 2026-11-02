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
            throw new BadRequestException('В файле не указан период расписания');
        }

        const warnings: string[] = [...parsed.warnings];
        const group = await this.findOrCreateGroup(parsed.groupName);

        const validFrom = this.toDate(parsed.periodStart);
        const validTo = this.toDate(parsed.periodEnd);

        let schedule = await this.schedulesRepository.findOne({
            where: {
                scheduleType: ScheduleType.STUDENT,
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

        let itemsCount = 0;

        for (const slot of parsed.lessons) {
            const item = await this.mapSlotToItem(
                slot,
                schedule.id,
                group.id,
                warnings,
            );

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