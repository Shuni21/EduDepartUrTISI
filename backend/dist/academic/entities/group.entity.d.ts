import { Subgroup } from './subgroup.entity';
import { StudentProfile } from '../../users/entities/student-profile.entity';
import { Schedule } from '../../schedule/entities/schedule.entity';
export declare enum EducationForm {
    FULL_TIME = "full_time",
    PART_TIME = "part_time",
    DISTANCE = "distance"
}
export declare class Group {
    id: number;
    name: string;
    course: number;
    educationForm: EducationForm;
    subgroups: Subgroup[];
    studentProfiles: StudentProfile[];
    schedules: Schedule[];
}
