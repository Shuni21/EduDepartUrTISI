import { Repository } from 'typeorm';
import { ScheduleItem } from './entities/schedule-item.entity';
import { Schedule } from './entities/schedule.entity';
import { User } from '../users/entities/user.entity';
import { LinkedLessonService } from './linked-lesson.service';
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
export declare class ScheduleDisplayService {
    private readonly itemsRepository;
    private readonly schedulesRepository;
    private readonly usersRepository;
    private readonly linkedLessonService;
    constructor(itemsRepository: Repository<ScheduleItem>, schedulesRepository: Repository<Schedule>, usersRepository: Repository<User>, linkedLessonService: LinkedLessonService);
    private normalizeText;
    private parseDateValue;
    private formatWeekLabel;
    private buildWeeksFromItems;
    private baseItemsQuery;
    getBuildingFromRoom(room: string): string | null;
    private isRomanRoomLabel;
    private isDistanceRoom;
    listGroups(): Promise<ScheduleGroupInfo[]>;
    getGroupSchedule(groupName: string): Promise<GroupScheduleResponse>;
    listTeachers(departmentId?: number): Promise<string[]>;
    private collectTeachersFromAccounts;
    private collectTeachersFromSchedule;
    getTeacherSchedule(teacherName: string): Promise<TeacherScheduleResponse>;
    listBuildings(): Promise<string[]>;
    listRooms(building?: string): Promise<string[]>;
    getRoomSchedule(roomName: string): Promise<RoomScheduleResponse>;
}
