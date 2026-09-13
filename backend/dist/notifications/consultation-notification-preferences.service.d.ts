import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { ConsultationNotificationPreference } from './consultation-notification-preference.entity';
import { ConsultationNotificationPreferenceResponse, ConsultationTeacherOption, UpdateConsultationNotificationPreferenceDto } from './dto/consultation-notification-preference.dto';
export declare class ConsultationNotificationPreferencesService {
    private readonly preferencesRepository;
    private readonly usersRepository;
    constructor(preferencesRepository: Repository<ConsultationNotificationPreference>, usersRepository: Repository<User>);
    getForUser(userId: number): Promise<ConsultationNotificationPreferenceResponse>;
    updateForUser(userId: number, dto: UpdateConsultationNotificationPreferenceDto): Promise<ConsultationNotificationPreferenceResponse>;
    listTeacherOptions(): Promise<ConsultationTeacherOption[]>;
    findSubscriberUserIds(teacherId: number): Promise<number[]>;
    private assertTeachersExist;
    private mapPreference;
}
