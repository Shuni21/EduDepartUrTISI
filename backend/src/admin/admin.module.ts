import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from '../users/users.module';
import { AcademicModule } from '../academic/academic.module';
import { AuthModule } from '../auth/auth.module';
import { SessionsModule } from '../sessions/sessions.module';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminAcademicService } from './admin-academic.service';
import { AdminGuard } from './guards/admin.guard';
import { UsersSeedService } from '../database/users-seed.service';
import { RolesSeedService } from './roles-seed.service';

import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { ConsultationNotificationPreference } from '../notifications/consultation-notification-preference.entity';
import { Consultation } from '../schedule/entities/consultation.entity';
import { Schedule } from '../schedule/entities/schedule.entity';
import { ScheduleItem } from '../schedule/entities/schedule-item.entity';
import { ScheduleUpload } from '../schedule/entities/schedule-upload.entity';
import { Role } from '../users/entities/role.entity';
import { StudentProfile } from '../users/entities/student-profile.entity';
import { TeacherProfile } from '../users/entities/teacher-profile.entity';
import { StaffProfile } from '../users/entities/staff-profile.entity';
import { User } from '../users/entities/user.entity';
import { Department } from '../academic/entities/department.entity';
import { Group } from '../academic/entities/group.entity';
import { Subgroup } from '../academic/entities/subgroup.entity';

@Module({
    imports: [
        UsersModule,
        AcademicModule,
        AuthModule,
        SessionsModule,
        TypeOrmModule.forFeature([
            RefreshToken,
            Role,
            User,
            StudentProfile,
            TeacherProfile,
            StaffProfile,
            Department,
            Group,
            Subgroup,
            Schedule,
            Consultation,
            ScheduleItem,
            Schedule,
            ScheduleUpload,
            ConsultationNotificationPreference,
        ]),
    ],
    controllers: [AdminController],
    providers: [
        AdminService,
        AdminAcademicService,
        AdminGuard,
        RolesSeedService,
        UsersSeedService,
    ],
})
export class AdminModule {}
