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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleNotifierService = void 0;
const common_1 = require("@nestjs/common");
const schedule_gateway_1 = require("./schedule.gateway");
let ScheduleNotifierService = class ScheduleNotifierService {
    scheduleGateway;
    constructor(scheduleGateway) {
        this.scheduleGateway = scheduleGateway;
    }
    notifyScheduleChanged(reason) {
        this.scheduleGateway.broadcastScheduleChanged({ reason });
    }
    notifyPreholidayDaysUpdated(preholidayDays) {
        this.scheduleGateway.broadcastPreholidayDaysUpdated(preholidayDays);
        this.notifyScheduleChanged('preholiday-updated');
    }
};
exports.ScheduleNotifierService = ScheduleNotifierService;
exports.ScheduleNotifierService = ScheduleNotifierService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [schedule_gateway_1.ScheduleGateway])
], ScheduleNotifierService);
//# sourceMappingURL=schedule-notifier.service.js.map