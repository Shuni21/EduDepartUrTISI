import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WsException,
    WebSocketGateway,
    WebSocketServer
} from "@nestjs/websockets";
import {Injectable, Logger} from "@nestjs/common";
import {Server, Socket} from "socket.io";
import {isAllowedCorsOrigin} from "../config/network";
import {normalizeRoomListKey} from "./parser/schedule-slot.utils";

export type ScheduleChangedPayload = {
    reason:
        | 'item-created'
        | 'item-updated'
        | 'item-disabled'
        | 'item-deleted'
        | 'preholiday-updated'
        | 'schedule-uploaded'
        | 'schedule-upload-deleted'
}

export type ScheduleTargetType = 'group' | 'teacher' | 'room'

export type ScheduleTarget = {
    type: ScheduleTargetType
    identity: string
}

const SCHEDULE_TARGET_TYPES = new Set<ScheduleTargetType>(['group', 'teacher', 'room'])

function normalizeScheduleTarget(value: unknown): ScheduleTarget {
    if (!value || typeof value !== 'object') {
        throw new WsException('Invalid schedule subscription')
    }

    const target = value as Partial<ScheduleTarget>
    if (
        typeof target.type !== 'string'
        || !SCHEDULE_TARGET_TYPES.has(target.type as ScheduleTargetType)
        || typeof target.identity !== 'string'
    ) {
        throw new WsException('Invalid schedule subscription')
    }

    const identity = target.identity.trim()
    if (!identity || identity.length > 200 || /[\u0000-\u001F\u007F]/.test(identity)) {
        throw new WsException('Invalid schedule identity')
    }

    const normalizedIdentity = target.type === 'room'
        ? normalizeRoomListKey(identity)
        : identity.toUpperCase()
    if (!normalizedIdentity) {
        throw new WsException('Invalid schedule identity')
    }

    return {
        type: target.type as ScheduleTargetType,
        identity: normalizedIdentity,
    }
}

function getScheduleRoom(target: ScheduleTarget): string {
    return `schedule:${target.type}:${encodeURIComponent(target.identity)}`
}

@Injectable()
@WebSocketGateway({
    namespace: `/schedules/live`,
    cors: {
        origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
            if (!origin || isAllowedCorsOrigin(origin)) {
                callback(null, true);
                return;
            }
            callback(new Error(`Not allowed by CORS`), false);
        },
        credentials: true
    },
})
export class ScheduleGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(ScheduleGateway.name);
    @WebSocketServer()
    server!: Server;

    handleConnection(@ConnectedSocket() client: Socket): void {
        this.logger.debug(`Schedule a websocket connected ${client.id}`);
    }

    handleDisconnect(@ConnectedSocket() client: Socket): void {
        this.logger.debug(`Schedule a websocket disconnected ${client.id}`);
    }

    @SubscribeMessage('schedule:subscribe')
    async subscribeToSchedule(
        @ConnectedSocket() client: Socket,
        @MessageBody() value: unknown,
    ): Promise<void> {
        const target = normalizeScheduleTarget(value)
        await client.join(getScheduleRoom(target))
    }

    @SubscribeMessage('schedule:unsubscribe')
    async unsubscribeFromSchedule(
        @ConnectedSocket() client: Socket,
        @MessageBody() value: unknown,
    ): Promise<void> {
        const target = normalizeScheduleTarget(value)
        await client.leave(getScheduleRoom(target))
    }

    broadcastScheduleChanged(payload: ScheduleChangedPayload, targets: ScheduleTarget[]): void {
        const rooms = Array.from(new Set(targets.map((target) => {
            const normalizedTarget = normalizeScheduleTarget(target)
            return getScheduleRoom(normalizedTarget)
        })))

        if (rooms.length > 0) {
            this.server?.to(rooms).emit('schedule:changed', payload)
        }
    }

    broadcastGlobalScheduleChanged(payload: ScheduleChangedPayload): void {
        this.server?.emit('schedule:changed', payload)
    }

    broadcastPreholidayDaysUpdated(preholidayDays: string[]): void {
        this.server?.emit('schedule:preholiday-days-updated', {
            preholidayDays,
        })
    }

}
