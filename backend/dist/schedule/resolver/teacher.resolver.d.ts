import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
export declare class TeacherResolver {
    private readonly usersRepository;
    constructor(usersRepository: Repository<User>);
    private parseTeacherName;
    private buildQuery;
    resolve(rawTeacherName: string): Promise<User | null>;
}
