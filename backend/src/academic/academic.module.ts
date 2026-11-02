import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DepartmentsController } from './departments.controller';
import { DepartmentsSeedService } from './departments-seed.service';
import { DepartmentsService } from './departments.service';
import { Department } from './entities/department.entity';
import { Group } from './entities/group.entity';
import { Subgroup } from './entities/subgroup.entity';
import { Subject } from './entities/subject.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Department,
            Group,
            Subgroup,
            Subject,
        ]),
    ],
    controllers: [DepartmentsController],
    providers: [DepartmentsService, DepartmentsSeedService],
    exports: [TypeOrmModule, DepartmentsService],
})
export class AcademicModule {}
