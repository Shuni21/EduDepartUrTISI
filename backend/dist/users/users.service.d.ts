import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
export declare class UsersService {
    private readonly usersRepository;
    constructor(usersRepository: Repository<User>);
    create(data: Partial<User>): Promise<User>;
    update(id: number, data: Partial<User>): Promise<void>;
    findById(id: number): Promise<User>;
    findByLogin(login: string): Promise<User | null>;
    findByLoginWithDetails(login: string): Promise<User | null>;
    findByIdWithDetails(id: number): Promise<User>;
    private readonly userDetailsRelations;
    findAll(): Promise<User[]>;
    findAllWithDetails(): Promise<User[]>;
    remove(id: number): Promise<void>;
}
