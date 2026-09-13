import { Repository } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import { UpdateSchedulePreholidayDayDto } from './dto/schedule-preholiday-day.dto';
import { SchedulePreholidayDay } from './entities/schedule-preholiday-day.entity';
import { ScheduleNotifierService } from './schedule-notifier.service';
export declare class SchedulePreholidayService {
    private readonly preholidayDaysRepository;
    private readonly scheduleNotifier;
    private readonly notificationsService;
    constructor(preholidayDaysRepository: Repository<SchedulePreholidayDay>, scheduleNotifier: ScheduleNotifierService, notificationsService: NotificationsService);
    private normalizeDate;
    private formatDate;
    listPreholidayDays(): Promise<string[]>;
    updatePreholidayDay(dto: UpdateSchedulePreholidayDayDto): Promise<string[]>;
}
