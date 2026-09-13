import { RoleCode } from '../../users/entities/role.entity';
export interface SeedUserDefinition {
    envLoginKey: string;
    envPasswordKey: string;
    defaultLogin: string;
    role: RoleCode;
    surname: string;
    name: string;
    patronymic: string;
    departmentName: string;
    position: string;
}
export declare const SEED_USERS: SeedUserDefinition[];
