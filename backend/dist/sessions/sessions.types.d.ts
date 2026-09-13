import { RoleCode } from '../users/entities/role.entity';
export type AdminSessionResponse = {
    id: number;
    userId: number;
    login: string;
    fullName: string;
    role: RoleCode;
    createdAt: Date;
};
export type SessionRemovedPayload = {
    id: number;
};
export type UserSessionResponse = {
    id: number;
    createdAt: Date;
    isCurrent: boolean;
};
