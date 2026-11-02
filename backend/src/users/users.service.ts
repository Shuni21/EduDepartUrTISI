import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) {}

    async create(data: Partial<User>): Promise<User> {
        const user = this.usersRepository.create(data);

        return this.usersRepository.save(user);
    }

    async update(id: number, data: Partial<User>): Promise<void> {
        await this.findById(id);
        await this.usersRepository.update(id, data);
    }

    async findById(id: number): Promise<User> {
        const user = await this.usersRepository.findOne({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException(
                `Пользователь с id ${id} не найден`,
            );
        }

        return user;
    }

    async findByLogin(login: string): Promise<User | null> {
        return this.usersRepository.findOne({
            where: { login },
        });
    }

    async findByLoginWithDetails(login: string): Promise<User | null> {
        return this.usersRepository.findOne({
            where: { login },
            relations: this.userDetailsRelations,
        });
    }

    async findByIdWithDetails(id: number): Promise<User> {
        const user = await this.usersRepository.findOne({
            where: { id },
            relations: this.userDetailsRelations,
        });

        if (!user) {
            throw new NotFoundException(
                `Пользователь с id ${id} не найден`,
            );
        }

        return user;
    }

    private readonly userDetailsRelations = [
        'role',
        'studentProfile',
        'studentProfile.group',
        'teacherProfile',
        'teacherProfile.department',
        'staffProfile',
        'staffProfile.department',
    ];

    async findAll(): Promise<User[]> {
        return this.usersRepository.find();
    }

    async findAllWithDetails(): Promise<User[]> {
        return this.usersRepository.find({
            relations: this.userDetailsRelations,
            order: { id: 'ASC' },
        });
    }

    async remove(id: number): Promise<void> {
        await this.usersRepository.delete(id);
    }
}