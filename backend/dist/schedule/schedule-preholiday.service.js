"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulePreholidayService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const notifications_service_1 = require("../notifications/notifications.service");
const schedule_preholiday_day_entity_1 = require("./entities/schedule-preholiday-day.entity");
const schedule_notifier_service_1 = require("./schedule-notifier.service");
let SchedulePreholidayService = class SchedulePreholidayService {
    preholidayDaysRepository;
    scheduleNotifier;
    notificationsService;
    constructor(preholidayDaysRepository, scheduleNotifier, notificationsService) {
        this.preholidayDaysRepository = preholidayDaysRepository;
        this.scheduleNotifier = scheduleNotifier;
        this.notificationsService = notificationsService;
    }
    normalizeDate(value) {
        const trimmed = value.trim();
        const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (isoMatch) {
            return trimmed;
        }
        const dottedMatch = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
        if (dottedMatch) {
            return `${dottedMatch[3]}-${dottedMatch[2]}-${dottedMatch[1]}`;
        }
        throw new common_1.BadRequestException('Дата должна быть в формате ДД.ММ.ГГГГ');
    }
    formatDate(value) {
        if (value instanceof Date) {
            const day = String(value.getDate()).padStart(2, '0');
            const month = String(value.getMonth() + 1).padStart(2, '0');
            const year = value.getFullYear();
            return `${day}.${month}.${year}`;
        }
        const [year, month, day] = value.split('-');
        return `${day}.${month}.${year}`;
    }
    async listPreholidayDays() {
        const days = await this.preholidayDaysRepository.find({
            order: { date: 'ASC' },
        });
        return days.map((day) => this.formatDate(day.date));
    }
    async updatePreholidayDay(dto) {
        const date = this.normalizeDate(dto.date);
        let shouldNotifyUsers = false;
        if (dto.isPreholiday) {
            const existing = await this.preholidayDaysRepository.findOne({
                where: { date },
            });
            if (!existing) {
                await this.preholidayDaysRepository.save(this.preholidayDaysRepository.create({ date }));
                shouldNotifyUsers = true;
            }
        }
        else {
            await this.preholidayDaysRepository.delete({ date });
        }
        const preholidayDays = await this.listPreholidayDays();
        this.scheduleNotifier.notifyPreholidayDaysUpdated(preholidayDays);
        if (shouldNotifyUsers) {
            await this.notificationsService.notifyPreholidayDayCreated(date);
        }
        return preholidayDays;
    }
};
exports.SchedulePreholidayService = SchedulePreholidayService;
exports.SchedulePreholidayService = SchedulePreholidayService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(schedule_preholiday_day_entity_1.SchedulePreholidayDay)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        schedule_notifier_service_1.ScheduleNotifierService,
        notifications_service_1.NotificationsService])
], SchedulePreholidayService);
//# sourceMappingURL=schedule-preholiday.service.js.map