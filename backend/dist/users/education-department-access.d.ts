import { User } from './entities/user.entity';
export declare function normalizeDepartmentName(name?: string | null): string;
export declare function isEducationDepartmentName(name?: string | null): boolean;
export declare function canManageSchedule(user: User): boolean;
