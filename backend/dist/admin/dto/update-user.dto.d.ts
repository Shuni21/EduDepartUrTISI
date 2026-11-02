import { RoleCode } from '../../users/entities/role.entity';
export declare class UpdateUserDto {
    login: string;
    password?: string;
    role: RoleCode;
    surname: string;
    name: string;
    patronymic?: string;
    isActive?: boolean;
    group?: string;
    educationForm?: string;
    course?: number;
    departmentId?: number;
    department?: string;
    position?: string;
    cabinet?: string;
}
export type UserProfileInput = {
    role: RoleCode;
    group?: string;
    educationForm?: string;
    course?: number;
    departmentId?: number;
    department?: string;
    position?: string;
    cabinet?: string;
};
