import { Role } from './role.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { StudentProfile } from './student-profile.entity';
import { TeacherProfile } from './teacher-profile.entity';
import { StaffProfile } from './staff-profile.entity';
export declare class User {
    id: number;
    login: string;
    passwordHash: string;
    roleId: number;
    role: Role;
    surname: string;
    name: string;
    patronymic: string;
    photoUrl: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    refreshTokens: RefreshToken[];
    studentProfile?: StudentProfile;
    teacherProfile?: TeacherProfile;
    staffProfile?: StaffProfile;
}
