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
var ScheduleGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const network_1 = require("../config/network");
const schedule_slot_utils_1 = require("./parser/schedule-slot.utils");
const SCHEDULE_TARGET_TYPES = new Set(['group', 'teacher', 'room']);
function normalizeScheduleTarget(value) {
    if (!value || typeof value !== 'object') {
        throw new websockets_1.WsException('Invalid schedule subscription: expected an object');
    }
    const target = value;
    if (typeof target.type !== 'string' || !SCHEDULE_TARGET_TYPES.has(target.type)) {
        throw new websockets_1.WsException('Invalid schedule subscription: type must be group, teacher, or room');
    }
    if (typeof target.identity !== 'string') {
        throw new websockets_1.WsException('Invalid schedule identity: expected a string');
    }
    const unsupportedControlCharacter = target.identity.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/);
    if (unsupportedControlCharacter) {
        const codePoint = unsupportedControlCharacter[0].codePointAt(0)?.toString(16).padStart(4, '0');
        throw new websockets_1.WsException(`Invalid schedule identity: unsupported control character U+${codePoint}`);
    }
    const identity = target.identity
        .replace(/[\t\r\n]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (!identity) {
        throw new websockets_1.WsException('Invalid schedule identity: empty after whitespace normalization');
    }
    if (identity.length > 200) {
        throw new websockets_1.WsException(`Invalid schedule identity: length ${identity.length} exceeds 200 characters`);
    }
    const normalizedIdentity = target.type === 'room'
        ? (0, schedule_slot_utils_1.normalizeRoomListKey)(identity)
        : identity.toUpperCase();
    if (!normalizedIdentity) {
        throw new websockets_1.WsException(`Invalid schedule identity: no usable ${target.type} key after normalization`);
    }
    return {
        type: target.type,
        identity: normalizedIdentity,
    };
}
function getIdentityForLog(value) {
    if (typeof value !== 'string') {
        return '<non-string>';
    }
    const preview = value.slice(0, 80);
    return `${JSON.stringify(preview)}${value.length > preview.length ? '…' : ''} (length=${value.length})`;
}
function getScheduleRoom(target) {
    return `schedule:${target.type}:${encodeURIComponent(target.identity)}`;
}
let ScheduleGateway = ScheduleGateway_1 = class ScheduleGateway {
    logger = new common_1.Logger(ScheduleGateway_1.name);
    server;
    handleConnection(client) {
        this.logger.debug(`Schedule a websocket connected ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.debug(`Schedule a websocket disconnected ${client.id}`);
    }
    async subscribeToSchedule(client, value) {
        const target = normalizeScheduleTarget(value);
        await client.join(getScheduleRoom(target));
    }
    async unsubscribeFromSchedule(client, value) {
        const target = normalizeScheduleTarget(value);
        await client.leave(getScheduleRoom(target));
    }
    broadcastScheduleChanged(payload, targets) {
        const rooms = new Set();
        for (const target of targets) {
            try {
                rooms.add(getScheduleRoom(normalizeScheduleTarget(target)));
            }
            catch (error) {
                if (!(error instanceof websockets_1.WsException)) {
                    throw error;
                }
                this.logger.warn(`Skipping invalid schedule broadcast target: ${error.message}; `
                    + `type=${JSON.stringify(target?.type)}, identity=${getIdentityForLog(target?.identity)}`);
            }
        }
        if (rooms.size > 0) {
            this.server?.to(Array.from(rooms)).emit('schedule:changed', payload);
        }
    }
    broadcastGlobalScheduleChanged(payload) {
        this.server?.emit('schedule:changed', payload);
    }
    broadcastPreholidayDaysUpdated(preholidayDays) {
        this.server?.emit('schedule:preholiday-days-updated', {
            preholidayDays,
        });
    }
};
exports.ScheduleGateway = ScheduleGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ScheduleGateway.prototype, "server", void 0);
__decorate([
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ScheduleGateway.prototype, "handleConnection", null);
__decorate([
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ScheduleGateway.prototype, "handleDisconnect", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('schedule:subscribe'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ScheduleGateway.prototype, "subscribeToSchedule", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('schedule:unsubscribe'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ScheduleGateway.prototype, "unsubscribeFromSchedule", null);
exports.ScheduleGateway = ScheduleGateway = ScheduleGateway_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({
        namespace: `/schedules/live`,
        cors: {
            origin: (origin, callback) => {
                if (!origin || (0, network_1.isAllowedCorsOrigin)(origin)) {
                    callback(null, true);
                    return;
                }
                callback(new Error(`Not allowed by CORS`), false);
            },
            credentials: true
        },
    })
], ScheduleGateway);
//# sourceMappingURL=schedule.gateway.js.map