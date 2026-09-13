import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
export declare class DepartmentsSeedService implements OnModuleInit {
    private readonly departmentRepository;
    constructor(departmentRepository: Repository<Department>);
    onModuleInit(): Promise<void>;
    private seedTeacherDepartments;
    private seedStaffDepartments;
}
