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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const access_token_guard_1 = require("../auth/guards/access-token.guard");
const admin_guard_1 = require("./guards/admin.guard");
const admin_service_1 = require("./admin.service");
const admin_academic_service_1 = require("./admin-academic.service");
const multipart_parser_1 = require("./dto/multipart.parser");
const set_department_head_dto_1 = require("./dto/set-department-head.dto");
const create_direction_dto_1 = require("./dto/create-direction.dto");
const create_group_dto_1 = require("./dto/create-group.dto");
const create_teacher_department_dto_1 = require("./dto/create-teacher-department.dto");
const create_staff_department_dto_1 = require("./dto/create-staff-department.dto");
let AdminController = class AdminController {
    adminService;
    adminAcademicService;
    constructor(adminService, adminAcademicService) {
        this.adminService = adminService;
        this.adminAcademicService = adminAcademicService;
    }
    listUsers() {
        return this.adminService.listUsers();
    }
    createUser(body, photo) {
        const dto = (0, multipart_parser_1.parseCreateUserBody)(body);
        return this.adminService.createUser(dto, photo);
    }
    getUser(id) {
        return this.adminService.getUser(id);
    }
    updateUser(id, body, photo, req) {
        const dto = (0, multipart_parser_1.parseUpdateUserBody)(body);
        return this.adminService.updateUser(id, dto, req.user.sub, photo);
    }
    deleteUser(id, req) {
        return this.adminService.deleteUser(id, req.user.sub);
    }
    listSessions() {
        return this.adminService.listActiveSessions();
    }
    revokeSession(id) {
        return this.adminService.revokeSession(id);
    }
    getAcademicOverview() {
        return this.adminAcademicService.getOverview();
    }
    createAcademicDirection(dto) {
        return this.adminAcademicService.createDirection(dto);
    }
    createAcademicGroup(directionId, dto) {
        return this.adminAcademicService.createGroup(directionId, dto);
    }
    createTeacherDepartment(dto) {
        return this.adminAcademicService.createTeacherDepartment(dto);
    }
    createStaffDepartment(dto) {
        return this.adminAcademicService.createStaffDepartment(dto);
    }
    setDepartmentHead(id, dto) {
        return this.adminAcademicService.setDepartmentHead(id, dto.headUserId ?? null);
    }
    deleteAcademicGroup(id) {
        return this.adminAcademicService.deleteGroup(id);
    }
    deleteAcademicDirection(id) {
        return this.adminAcademicService.deleteDirection(id);
    }
    deleteAcademicDepartment(id) {
        return this.adminAcademicService.deleteDepartment(id);
    }
    listStaffDepartments() {
        return this.adminService.listStaffDepartments();
    }
    mergeAcademicDirections(sourceId, targetId) {
        return this.adminAcademicService.mergeDirections(sourceId, targetId);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('users'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listUsers", null);
__decorate([
    (0, common_1.Post)('users'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('photo', {
        storage: (0, multer_1.memoryStorage)(),
        ...multipart_parser_1.avatarUploadOptions,
    })),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createUser", null);
__decorate([
    (0, common_1.Get)('users/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getUser", null);
__decorate([
    (0, common_1.Patch)('users/:id'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('photo', {
        storage: (0, multer_1.memoryStorage)(),
        ...multipart_parser_1.avatarUploadOptions,
    })),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Delete)('users/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Get)('sessions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listSessions", null);
__decorate([
    (0, common_1.Delete)('sessions/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "revokeSession", null);
__decorate([
    (0, common_1.Get)('academic/overview'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getAcademicOverview", null);
__decorate([
    (0, common_1.Post)('academic/directions'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_direction_dto_1.CreateDirectionDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createAcademicDirection", null);
__decorate([
    (0, common_1.Post)('academic/directions/:directionId/groups'),
    __param(0, (0, common_1.Param)('directionId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, create_group_dto_1.CreateGroupDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createAcademicGroup", null);
__decorate([
    (0, common_1.Post)('academic/departments/teacher'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_teacher_department_dto_1.CreateTeacherDepartmentDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createTeacherDepartment", null);
__decorate([
    (0, common_1.Post)('academic/departments/staff'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_staff_department_dto_1.CreateStaffDepartmentDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createStaffDepartment", null);
__decorate([
    (0, common_1.Patch)('academic/departments/:id/head'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, set_department_head_dto_1.SetDepartmentHeadDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "setDepartmentHead", null);
__decorate([
    (0, common_1.Delete)('academic/groups/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deleteAcademicGroup", null);
__decorate([
    (0, common_1.Delete)('academic/directions/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deleteAcademicDirection", null);
__decorate([
    (0, common_1.Delete)('academic/departments/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deleteAcademicDepartment", null);
__decorate([
    (0, common_1.Get)('academic/departments/staff'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listStaffDepartments", null);
__decorate([
    (0, common_1.Post)('academic/directions/:sourceId/merge-into/:targetId'),
    __param(0, (0, common_1.Param)('sourceId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('targetId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "mergeAcademicDirections", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(access_token_guard_1.AccessTokenGuard, admin_guard_1.AdminGuard),
    __metadata("design:paramtypes", [admin_service_1.AdminService,
        admin_academic_service_1.AdminAcademicService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map