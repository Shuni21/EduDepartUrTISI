import { User } from '../users/entities/user.entity';
export declare class ConsultationNotificationPreference {
    userId: number;
    user: User;
    enabled: boolean;
    allTeachers: boolean;
    teacherIds: number[];
    updatedAt: Date;
}
