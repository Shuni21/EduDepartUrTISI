import { RoleCode } from '../../users/entities/role.entity';
export declare class CreateUserDto {
    login: string;
    password: string;
    role: RoleCode;
    surname: string;
    name: string;
    patronymic?: string;
    group?: string;
    direction?: string;
    educationForm?: string;
    course?: number;
    departmentId?: number;
    department?: string;
    position?: string;
    cabinet?: string;
}
