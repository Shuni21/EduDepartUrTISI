import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { Department } from '../academic/entities/department.entity';
import { Role } from '../users/entities/role.entity';
import { StaffProfile } from '../users/entities/staff-profile.entity';
import { User } from '../users/entities/user.entity';
import { SEED_USERS } from './seeds/users.seed';

@Injectable()
export class UsersSeedService implements OnModuleInit {
    private readonly logger = new Logger(UsersSeedService.name);

    constructor(
        private readonly configService: ConfigService,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
        @InjectRepository(StaffProfile)
        private readonly staffProfileRepository: Repository<StaffProfile>,
        @InjectRepository(Department)
        private readonly departmentRepository: Repository<Department>,
    ) {}

    async onModuleInit() {
        for (const seedUser of SEED_USERS) {
            await this.seedUser(seedUser);
        }
    }

    private async seedUser(seedUser: typeof SEED_USERS[number]): Promise<void> {
        const password = this.configService.get<string>(seedUser.envPasswordKey)?.trim();

        if (!password) {
            return;
        }

        if (password.length < 8) {
            this.logger.warn(
                `${seedUser.envPasswordKey} must be at least 8 characters; skipping ${seedUser.defaultLogin}`,
            );
            return;
        }

        const login = (
            this.configService.get<string>(seedUser.envLoginKey)?.trim()
            || seedUser.defaultLogin
        );

        const existing = await this.userRepository.findOne({
            where: { login },
        });

        if (existing) {
            this.logger.log(`Seed user "${login}" already exists`);
            return;
        }

        const role = await this.roleRepository.findOne({
            where: { code: seedUser.role },
        });

        if (!role) {
            this.logger.warn(`Role ${seedUser.role} is not ready; skipping ${login}`);
            return;
        }

        const department = await this.departmentRepository.findOne({
            where: { name: seedUser.departmentName },
        });

        if (!department) {
            this.logger.warn(
                `Department "${seedUser.departmentName}" is not ready; skipping ${login}`,
            );
            return;
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await this.userRepository.save({
            login,
            passwordHash,
            roleId: role.id,
            surname: seedUser.surname,
            name: seedUser.name,
            patronymic: seedUser.patronymic,
            isActive: true,
        });

        await this.staffProfileRepository.save({
            userId: user.id,
            departmentId: department.id,
            position: seedUser.position,
            cabinet: null,
        });

        this.logger.log(`Created seed user "${login}" (${seedUser.role})`);
    }
}
