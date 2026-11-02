import {
    IsBoolean,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Max,
    Min,
    MinLength,
} from 'class-validator';

import { RoleCode } from '../../users/entities/role.entity';

export class UpdateUserDto {
    @IsString()
    @IsNotEmpty()
    login!: string;

    @IsString()
    @MinLength(8, { message: 'Пароль должен быть не менее 8 символов' })
    @IsOptional()
    password?: string;

    @IsEnum(RoleCode)
    role!: RoleCode;

    @IsString()
    @IsNotEmpty()
    surname!: string;

    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsOptional()
    patronymic?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsString()
    @IsOptional()
    group?: string;

    @IsString()
    @IsOptional()
    educationForm?: string;

    @IsInt()
    @Min(1)
    @Max(6)
    @IsOptional()
    course?: number;

    @IsInt()
    @IsOptional()
    departmentId?: number;

    @IsString()
    @IsOptional()
    department?: string;

    @IsString()
    @IsOptional()
    position?: string;

    @IsString()
    @IsOptional()
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
