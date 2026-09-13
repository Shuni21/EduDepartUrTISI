import { TeacherProfile } from '../../users/entities/teacher-profile.entity';
import { StaffProfile } from '../../users/entities/staff-profile.entity';
import { User } from '../../users/entities/user.entity';
export declare class Department {
    id: number;
    name: string;
    shortName: string | null;
    headUserId: number | null;
    headUser?: User | null;
    teacherProfiles: TeacherProfile[];
    staffProfiles: StaffProfile[];
}
