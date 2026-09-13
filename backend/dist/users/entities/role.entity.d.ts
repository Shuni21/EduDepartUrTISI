import { User } from './user.entity';
export declare enum RoleCode {
    ADMIN = "admin",
    STUDENT = "student",
    TEACHER = "teacher",
    EMPLOYEE = "employee"
}
export declare class Role {
    id: number;
    code: RoleCode;
    name: string;
    users: User[];
}
