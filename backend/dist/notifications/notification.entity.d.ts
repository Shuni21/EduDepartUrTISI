import { User } from '../users/entities/user.entity';
export declare enum NotificationType {
    SCHEDULE = "schedule",
    CONSULTATION = "consultation"
}
export declare class Notification {
    id: number;
    userId: number;
    user: User;
    type: NotificationType;
    title: string;
    message: string;
    payload: Record<string, unknown> | null;
    isRead: boolean;
    createdAt: Date;
}
