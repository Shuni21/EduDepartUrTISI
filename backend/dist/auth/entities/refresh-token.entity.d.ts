import { User } from '../../users/entities/user.entity';
export declare class RefreshToken {
    id: number;
    userId: number;
    user: User;
    tokenHash: string;
    isActive: boolean;
    createdAt: Date;
}
