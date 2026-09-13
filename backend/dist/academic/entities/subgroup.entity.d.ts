import { Group } from './group.entity';
import { StudentProfile } from '../../users/entities/student-profile.entity';
import { ScheduleItem } from '../../schedule/entities/schedule-item.entity';
export declare class Subgroup {
    id: number;
    groupId: number;
    group: Group;
    number: 1 | 2;
    studentProfiles: StudentProfile[];
    scheduleItems: ScheduleItem[];
}
