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
exports.ScheduleDisplayController = void 0;
const common_1 = require("@nestjs/common");
const schedule_display_service_1 = require("./schedule-display.service");
let ScheduleDisplayController = class ScheduleDisplayController {
    scheduleDisplayService;
    constructor(scheduleDisplayService) {
        this.scheduleDisplayService = scheduleDisplayService;
    }
    listGroups() {
        return this.scheduleDisplayService.listGroups();
    }
    getGroupSchedule(groupName) {
        return this.scheduleDisplayService.getGroupSchedule(groupName);
    }
    listTeachers(departmentId) {
        const parsedDepartmentId = departmentId ? Number(departmentId) : undefined;
        return this.scheduleDisplayService.listTeachers(parsedDepartmentId && !Number.isNaN(parsedDepartmentId)
            ? parsedDepartmentId
            : undefined);
    }
    getTeacherSchedule(teacherName) {
        return this.scheduleDisplayService.getTeacherSchedule(teacherName);
    }
    listBuildings() {
        return this.scheduleDisplayService.listBuildings();
    }
    listRooms(building) {
        return this.scheduleDisplayService.listRooms(building);
    }
    getRoomSchedule(roomName) {
        return this.scheduleDisplayService.getRoomSchedule(roomName);
    }
};
exports.ScheduleDisplayController = ScheduleDisplayController;
__decorate([
    (0, common_1.Get)('groups'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScheduleDisplayController.prototype, "listGroups", null);
__decorate([
    (0, common_1.Get)('groups/:groupName'),
    __param(0, (0, common_1.Param)('groupName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ScheduleDisplayController.prototype, "getGroupSchedule", null);
__decorate([
    (0, common_1.Get)('teachers'),
    __param(0, (0, common_1.Query)('departmentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ScheduleDisplayController.prototype, "listTeachers", null);
__decorate([
    (0, common_1.Get)('teachers/:teacherName'),
    __param(0, (0, common_1.Param)('teacherName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ScheduleDisplayController.prototype, "getTeacherSchedule", null);
__decorate([
    (0, common_1.Get)('buildings'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScheduleDisplayController.prototype, "listBuildings", null);
__decorate([
    (0, common_1.Get)('rooms'),
    __param(0, (0, common_1.Query)('building')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ScheduleDisplayController.prototype, "listRooms", null);
__decorate([
    (0, common_1.Get)('rooms/:roomName'),
    __param(0, (0, common_1.Param)('roomName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ScheduleDisplayController.prototype, "getRoomSchedule", null);
exports.ScheduleDisplayController = ScheduleDisplayController = __decorate([
    (0, common_1.Controller)('schedules'),
    __metadata("design:paramtypes", [schedule_display_service_1.ScheduleDisplayService])
], ScheduleDisplayController);
//# sourceMappingURL=schedule-display.controller.js.map