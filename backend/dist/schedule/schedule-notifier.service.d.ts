import { ScheduleGateway } from './schedule.gateway';
import type { ScheduleChangedPayload } from './schedule.gateway';
export declare class ScheduleNotifierService {
    private readonly scheduleGateway;
    constructor(scheduleGateway: ScheduleGateway);
    notifyScheduleChanged(reason: ScheduleChangedPayload['reason']): void;
    notifyPreholidayDaysUpdated(preholidayDays: string[]): void;
}
