import { Repository } from 'typeorm';
import { Group } from '../academic/entities/group.entity';
import { Subject } from '../academic/entities/subject.entity';
import { Subgroup } from '../academic/entities/subgroup.entity';
import { ParseScheduleResult } from './parser/excel-grid.parser';
import { Schedule } from './entities/schedule.entity';
import { ScheduleItem } from './entities/schedule-item.entity';
import { ScheduleUpload } from './entities/schedule-upload.entity';
import { RoomResolver } from './resolver/room.resolver';
import { TeacherResolver } from './resolver/teacher.resolver';
import { LessonTypeResolver } from './resolver/lesson-type.resolver';
export declare class ScheduleImportService {
    private readonly schedulesRepository;
    private readonly itemsRepository;
    private readonly groupsRepository;
    private readonly subjectsRepository;
    private readonly subgroupsRepository;
    private readonly roomResolver;
    private readonly teacherResolver;
    private readonly lessonTypeResolver;
    constructor(schedulesRepository: Repository<Schedule>, itemsRepository: Repository<ScheduleItem>, groupsRepository: Repository<Group>, subjectsRepository: Repository<Subject>, subgroupsRepository: Repository<Subgroup>, roomResolver: RoomResolver, teacherResolver: TeacherResolver, lessonTypeResolver: LessonTypeResolver);
    private findOrCreateGroup;
    private findOrCreateSubject;
    private findSubgroup;
    private toDate;
    private dedupeWarnings;
    static isImportResolvableWarning(warning: string): boolean;
    static mergeStoredWarnings(stored: string[] | null, importWarnings: string[]): string[];
    private static dedupeWarningsStatic;
    refreshUploadReferences(uploadId: number): Promise<string[]>;
    importParsedSchedule(parsed: ParseScheduleResult, upload: ScheduleUpload): Promise<{
        scheduleId: number;
        itemsCount: number;
        warnings: string[];
    }>;
    private mapSlotToItem;
}
