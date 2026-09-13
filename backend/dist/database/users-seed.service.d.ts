import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Department } from '../academic/entities/department.entity';
import { Role } from '../users/entities/role.entity';
import { StaffProfile } from '../users/entities/staff-profile.entity';
import { User } from '../users/entities/user.entity';
export declare class UsersSeedService implements OnModuleInit {
    private readonly configService;
    private readonly userRepository;
    private readonly roleRepository;
    private readonly staffProfileRepository;
    private readonly departmentRepository;
    private readonly logger;
    constructor(configService: ConfigService, userRepository: Repository<User>, roleRepository: Repository<Role>, staffProfileRepository: Repository<StaffProfile>, departmentRepository: Repository<Department>);
    onModuleInit(): Promise<void>;
    private seedUser;
}
