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
exports.ConsultationController = void 0;
const common_1 = require("@nestjs/common");
const access_token_guard_1 = require("../auth/guards/access-token.guard");
const users_service_1 = require("../users/users.service");
const consultation_service_1 = require("./consultation.service");
const consultation_dto_1 = require("./dto/consultation.dto");
const teacher_guard_1 = require("./guards/teacher.guard");
let ConsultationController = class ConsultationController {
    consultationService;
    usersService;
    constructor(consultationService, usersService) {
        this.consultationService = consultationService;
        this.usersService = usersService;
    }
    listDepartments() {
        return this.consultationService.listDepartments();
    }
    getDepartmentConsultations(departmentId) {
        return this.consultationService.getDepartmentConsultations(departmentId);
    }
    async createConsultation(request, dto) {
        const user = await this.usersService.findByIdWithDetails(request.user.sub);
        return this.consultationService.createConsultation(user, dto);
    }
    async updateConsultation(request, id, dto) {
        const user = await this.usersService.findByIdWithDetails(request.user.sub);
        return this.consultationService.updateConsultation(user, id, dto);
    }
    async deleteConsultation(request, id) {
        const user = await this.usersService.findByIdWithDetails(request.user.sub);
        return this.consultationService.deleteConsultation(user, id);
    }
};
exports.ConsultationController = ConsultationController;
__decorate([
    (0, common_1.Get)('departments'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ConsultationController.prototype, "listDepartments", null);
__decorate([
    (0, common_1.Get)('departments/:departmentId'),
    __param(0, (0, common_1.Param)('departmentId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ConsultationController.prototype, "getDepartmentConsultations", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(access_token_guard_1.AccessTokenGuard, teacher_guard_1.TeacherGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, consultation_dto_1.CreateConsultationDto]),
    __metadata("design:returntype", Promise)
], ConsultationController.prototype, "createConsultation", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(access_token_guard_1.AccessTokenGuard, teacher_guard_1.TeacherGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, consultation_dto_1.UpdateConsultationDto]),
    __metadata("design:returntype", Promise)
], ConsultationController.prototype, "updateConsultation", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(access_token_guard_1.AccessTokenGuard, teacher_guard_1.TeacherGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], ConsultationController.prototype, "deleteConsultation", null);
exports.ConsultationController = ConsultationController = __decorate([
    (0, common_1.Controller)('schedules/consultations'),
    __metadata("design:paramtypes", [consultation_service_1.ConsultationService,
        users_service_1.UsersService])
], ConsultationController);
//# sourceMappingURL=consultation.controller.js.map