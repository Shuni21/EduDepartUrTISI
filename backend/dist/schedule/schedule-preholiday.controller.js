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
exports.SchedulePreholidayAdminController = exports.SchedulePreholidayDisplayController = void 0;
const common_1 = require("@nestjs/common");
const access_token_guard_1 = require("../auth/guards/access-token.guard");
const schedule_preholiday_day_dto_1 = require("./dto/schedule-preholiday-day.dto");
const education_department_guard_1 = require("./guards/education-department.guard");
const schedule_preholiday_service_1 = require("./schedule-preholiday.service");
let SchedulePreholidayDisplayController = class SchedulePreholidayDisplayController {
    schedulePreholidayService;
    constructor(schedulePreholidayService) {
        this.schedulePreholidayService = schedulePreholidayService;
    }
    listPreholidayDays() {
        return this.schedulePreholidayService.listPreholidayDays();
    }
};
exports.SchedulePreholidayDisplayController = SchedulePreholidayDisplayController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SchedulePreholidayDisplayController.prototype, "listPreholidayDays", null);
exports.SchedulePreholidayDisplayController = SchedulePreholidayDisplayController = __decorate([
    (0, common_1.Controller)('schedules/preholiday-days'),
    __metadata("design:paramtypes", [schedule_preholiday_service_1.SchedulePreholidayService])
], SchedulePreholidayDisplayController);
let SchedulePreholidayAdminController = class SchedulePreholidayAdminController {
    schedulePreholidayService;
    constructor(schedulePreholidayService) {
        this.schedulePreholidayService = schedulePreholidayService;
    }
    updatePreholidayDay(dto) {
        return this.schedulePreholidayService.updatePreholidayDay(dto);
    }
};
exports.SchedulePreholidayAdminController = SchedulePreholidayAdminController;
__decorate([
    (0, common_1.Patch)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [schedule_preholiday_day_dto_1.UpdateSchedulePreholidayDayDto]),
    __metadata("design:returntype", Promise)
], SchedulePreholidayAdminController.prototype, "updatePreholidayDay", null);
exports.SchedulePreholidayAdminController = SchedulePreholidayAdminController = __decorate([
    (0, common_1.Controller)('education-department/schedules/preholiday-days'),
    (0, common_1.UseGuards)(access_token_guard_1.AccessTokenGuard, education_department_guard_1.EducationDepartmentGuard),
    __metadata("design:paramtypes", [schedule_preholiday_service_1.SchedulePreholidayService])
], SchedulePreholidayAdminController);
//# sourceMappingURL=schedule-preholiday.controller.js.map