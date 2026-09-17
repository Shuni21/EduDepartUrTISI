import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../entities/room.entity';
import { isDistanceRoom, isSharedMultiHallRoom } from '../parser/lesson-cell.parser';
import { normalizeRomanRoomKey, getRomanBuilding } from '../parser/roman-room.utils';

@Injectable()
export class RoomResolver {
    constructor(
        @InjectRepository(Room)
        private readonly roomsRepository: Repository<Room>,
    ) {}

    async resolve(rawRoom: string | null): Promise<Room | null> {
        if (!rawRoom?.trim()) {
            return null;
        }

        const normalized = rawRoom.trim().toUpperCase();
        const romanNumber = normalizeRomanRoomKey(normalized);

        const match = normalized.match(/^(\d+)\s*(УК\d)/);
        const number = romanNumber ?? match?.[1] ?? normalized;
        const building = romanNumber ? getRomanBuilding(rawRoom) : match?.[2] ?? null;

        let room = await this.roomsRepository.findOne({
            where: {
                number,
                building: building ?? undefined,
            },
        });

        if (!room) {
            room = this.roomsRepository.create({
                number,
                building,
                name: rawRoom.trim(),
                isOnline: isDistanceRoom(rawRoom),
                isSharedMultiHall: isSharedMultiHallRoom(rawRoom),
            });
            room = await this.roomsRepository.save(room);
        } else if (isSharedMultiHallRoom(rawRoom) && !room.isSharedMultiHall) {
            room.isSharedMultiHall = true;
            room = await this.roomsRepository.save(room);
        }

        return room;
    }
}