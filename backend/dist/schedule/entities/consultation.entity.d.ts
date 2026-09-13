import { Department } from '../../academic/entities/department.entity';
import { User } from '../../users/entities/user.entity';
export declare class Consultation {
    id: number;
    departmentId: number;
    department: Department;
    teacherId: number;
    teacher: User;
    subject: string;
    consultationType: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    weekStart: string;
    room: string | null;
    comment: string | null;
    createdAt: Date;
    updatedAt: Date;
}
