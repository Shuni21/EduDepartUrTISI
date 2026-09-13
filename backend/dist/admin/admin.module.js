"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const users_module_1 = require("../users/users.module");
const academic_module_1 = require("../academic/academic.module");
const auth_module_1 = require("../auth/auth.module");
const sessions_module_1 = require("../sessions/sessions.module");
const uploads_module_1 = require("../uploads/uploads.module");
const admin_controller_1 = require("./admin.controller");
const admin_service_1 = require("./admin.service");
const admin_academic_service_1 = require("./admin-academic.service");
const admin_guard_1 = require("./guards/admin.guard");
const users_seed_service_1 = require("../database/users-seed.service");
const roles_seed_service_1 = require("./roles-seed.service");
const refresh_token_entity_1 = require("../auth/entities/refresh-token.entity");
const consultation_notification_preference_entity_1 = require("../notifications/consultation-notification-preference.entity");
const consultation_entity_1 = require("../schedule/entities/consultation.entity");
const schedule_entity_1 = require("../schedule/entities/schedule.entity");
const schedule_item_entity_1 = require("../schedule/entities/schedule-item.entity");
const schedule_upload_entity_1 = require("../schedule/entities/schedule-upload.entity");
const role_entity_1 = require("../users/entities/role.entity");
const student_profile_entity_1 = require("../users/entities/student-profile.entity");
const teacher_profile_entity_1 = require("../users/entities/teacher-profile.entity");
const staff_profile_entity_1 = require("../users/entities/staff-profile.entity");
const user_entity_1 = require("../users/entities/user.entity");
const department_entity_1 = require("../academic/entities/department.entity");
const direction_entity_1 = require("../academic/entities/direction.entity");
const group_entity_1 = require("../academic/entities/group.entity");
const subgroup_entity_1 = require("../academic/entities/subgroup.entity");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            users_module_1.UsersModule,
            academic_module_1.AcademicModule,
            auth_module_1.AuthModule,
            sessions_module_1.SessionsModule,
            uploads_module_1.UploadsModule,
            typeorm_1.TypeOrmModule.forFeature([
                refresh_token_entity_1.RefreshToken,
                role_entity_1.Role,
                user_entity_1.User,
                student_profile_entity_1.StudentProfile,
                teacher_profile_entity_1.TeacherProfile,
                staff_profile_entity_1.StaffProfile,
                department_entity_1.Department,
                direction_entity_1.Direction,
                group_entity_1.Group,
                subgroup_entity_1.Subgroup,
                schedule_entity_1.Schedule,
                consultation_entity_1.Consultation,
                schedule_item_entity_1.ScheduleItem,
                schedule_entity_1.Schedule,
                schedule_upload_entity_1.ScheduleUpload,
                consultation_notification_preference_entity_1.ConsultationNotificationPreference,
            ]),
        ],
        controllers: [admin_controller_1.AdminController],
        providers: [
            admin_service_1.AdminService,
            admin_academic_service_1.AdminAcademicService,
            admin_guard_1.AdminGuard,
            roles_seed_service_1.RolesSeedService,
            users_seed_service_1.UsersSeedService,
        ],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map