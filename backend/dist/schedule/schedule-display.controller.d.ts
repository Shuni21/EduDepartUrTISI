import { GroupScheduleResponse, RoomScheduleResponse, ScheduleDisplayService, ScheduleGroupInfo, TeacherScheduleResponse } from './schedule-display.service';
export declare class ScheduleDisplayController {
    private readonly scheduleDisplayService;
    constructor(scheduleDisplayService: ScheduleDisplayService);
    listGroups(): Promise<ScheduleGroupInfo[]>;
    getGroupSchedule(groupName: string): Promise<GroupScheduleResponse>;
    listTeachers(departmentId?: string): Promise<string[]>;
    getTeacherSchedule(teacherName: string): Promise<TeacherScheduleResponse>;
    listBuildings(): Promise<string[]>;
    listRooms(building?: string): Promise<string[]>;
    getRoomSchedule(roomName: string): Promise<RoomScheduleResponse>;
}
