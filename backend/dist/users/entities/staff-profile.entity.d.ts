import { User } from './user.entity';
import { Department } from '../../academic/entities/department.entity';
export declare class StaffProfile {
    id: number;
    userId: number;
    user: User;
    departmentId: number;
    department: Department;
    position: string;
    cabinet: string | null;
}
