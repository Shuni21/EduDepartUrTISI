"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomResolver = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const room_entity_1 = require("../entities/room.entity");
const lesson_cell_parser_1 = require("../parser/lesson-cell.parser");
let RoomResolver = class RoomResolver {
    roomsRepository;
    constructor(roomsRepository) {
        this.roomsRepository = roomsRepository;
    }
    async resolve(rawRoom) {
        if (!rawRoom?.trim()) {
            return null;
        }
        const normalized = rawRoom.trim().toUpperCase();
        const match = normalized.match(/^(\d+)\s*(УК\d)/);
        const number = match?.[1] ?? normalized;
        const building = match?.[2] ?? null;
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
                isOnline: (0, lesson_cell_parser_1.isDistanceRoom)(rawRoom),
                isSharedMultiHall: (0, lesson_cell_parser_1.isSharedMultiHallRoom)(rawRoom),
            });
            room = await this.roomsRepository.save(room);
        }
        else if ((0, lesson_cell_parser_1.isSharedMultiHallRoom)(rawRoom) && !room.isSharedMultiHall) {
            room.isSharedMultiHall = true;
            room = await this.roomsRepository.save(room);
        }
        return room;
    }
};
exports.RoomResolver = RoomResolver;
exports.RoomResolver = RoomResolver = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(room_entity_1.Room)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], RoomResolver);
//# sourceMappingURL=room.resolver.js.map