import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Role } from '../users/entities/role.entity';
export declare class RolesSeedService implements OnModuleInit {
    private readonly roleRepository;
    constructor(roleRepository: Repository<Role>);
    onModuleInit(): Promise<void>;
}
