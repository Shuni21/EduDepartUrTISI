import { Repository } from 'typeorm';
import { Room } from '../entities/room.entity';
export declare class RoomResolver {
    private readonly roomsRepository;
    constructor(roomsRepository: Repository<Room>);
    resolve(rawRoom: string | null): Promise<Room | null>;
}
