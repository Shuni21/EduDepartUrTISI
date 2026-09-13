"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const group_entity_1 = require("../academic/entities/group.entity");
const direction_entity_1 = require("../academic/entities/direction.entity");
const subject_entity_1 = require("../academic/entities/subject.entity");
const subgroup_entity_1 = require("../academic/entities/subgroup.entity");
const academic_module_1 = require("../academic/academic.module");
const auth_module_1 = require("../auth/auth.module");
const role_entity_1 = require("../users/entities/role.entity");
const user_entity_1 = require("../users/entities/user.entity");
const users_module_1 = require("../users/users.module");
const consultation_controller_1 = require("./consultation.controller");
const consultation_service_1 = require("./consultation.service");
const consultation_entity_1 = require("./entities/consultation.entity");
const schedule_entity_1 = require("./entities/schedule.entity");
const schedule_item_entity_1 = require("./entities/schedule-item.entity");
const schedule_preholiday_day_entity_1 = require("./entities/schedule-preholiday-day.entity");
const schedule_upload_entity_1 = require("./entities/schedule-upload.entity");
const room_entity_1 = require("./entities/room.entity");
const lesson_type_entity_1 = require("./entities/lesson-type.entity");
const education_department_guard_1 = require("./guards/education-department.guard");
const teacher_guard_1 = require("./guards/teacher.guard");
const schedule_preholiday_controller_1 = require("./schedule-preholiday.controller");
const schedule_admin_controller_1 = require("./schedule-admin.controller");
const schedule_admin_service_1 = require("./schedule-admin.service");
const schedule_display_controller_1 = require("./schedule-display.controller");
const schedule_display_service_1 = require("./schedule-display.service");
const schedule_upload_controller_1 = require("./schedule-upload.controller");
const schedule_import_service_1 = require("./schedule-import.service");
const schedule_preholiday_service_1 = require("./schedule-preholiday.service");
const schedule_upload_service_1 = require("./schedule-upload.service");
const lesson_type_resolver_1 = require("./resolver/lesson-type.resolver");
const room_resolver_1 = require("./resolver/room.resolver");
const teacher_resolver_1 = require("./resolver/teacher.resolver");
const schedule_gateway_1 = require("./schedule.gateway");
const schedule_notifier_service_1 = require("./schedule-notifier.service");
const linked_lesson_service_1 = require("./linked-lesson.service");
const notifications_module_1 = require("../notifications/notifications.module");
let ScheduleModule = class ScheduleModule {
};
exports.ScheduleModule = ScheduleModule;
exports.ScheduleModule = ScheduleModule = __decorate([
    (0, common_1.Module)({
        imports: [
            academic_module_1.AcademicModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            notifications_module_1.NotificationsModule,
            typeorm_1.TypeOrmModule.forFeature([
                schedule_entity_1.Schedule,
                schedule_item_entity_1.ScheduleItem,
                schedule_preholiday_day_entity_1.SchedulePreholidayDay,
                schedule_upload_entity_1.ScheduleUpload,
                room_entity_1.Room,
                lesson_type_entity_1.LessonType,
                consultation_entity_1.Consultation,
                group_entity_1.Group,
                direction_entity_1.Direction,
                subject_entity_1.Subject,
                subgroup_entity_1.Subgroup,
                user_entity_1.User,
                role_entity_1.Role,
            ]),
        ],
        controllers: [
            schedule_upload_controller_1.ScheduleUploadController,
            schedule_admin_controller_1.ScheduleAdminController,
            schedule_display_controller_1.ScheduleDisplayController,
            schedule_preholiday_controller_1.SchedulePreholidayDisplayController,
            schedule_preholiday_controller_1.SchedulePreholidayAdminController,
            consultation_controller_1.ConsultationController,
        ],
        providers: [
            schedule_upload_service_1.ScheduleUploadService,
            schedule_import_service_1.ScheduleImportService,
            schedule_preholiday_service_1.SchedulePreholidayService,
            schedule_admin_service_1.ScheduleAdminService,
            schedule_display_service_1.ScheduleDisplayService,
            consultation_service_1.ConsultationService,
            linked_lesson_service_1.LinkedLessonService,
            room_resolver_1.RoomResolver,
            teacher_resolver_1.TeacherResolver,
            lesson_type_resolver_1.LessonTypeResolver,
            education_department_guard_1.EducationDepartmentGuard,
            teacher_guard_1.TeacherGuard,
            schedule_gateway_1.ScheduleGateway,
            schedule_notifier_service_1.ScheduleNotifierService,
        ],
        exports: [typeorm_1.TypeOrmModule],
    })
], ScheduleModule);
//# sourceMappingURL=schedule.module.js.map