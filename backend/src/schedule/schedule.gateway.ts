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
        throw new WsException('Invalid schedule subscription: expected an object')
    }

    const target = value as Partial<ScheduleTarget>
    if (typeof target.type !== 'string' || !SCHEDULE_TARGET_TYPES.has(target.type as ScheduleTargetType)) {
        throw new WsException('Invalid schedule subscription: type must be group, teacher, or room')
    }
    if (typeof target.identity !== 'string') {
        throw new WsException('Invalid schedule identity: expected a string')
    }

    const unsupportedControlCharacter = target.identity.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/)
    if (unsupportedControlCharacter) {
        const codePoint = unsupportedControlCharacter[0].codePointAt(0)?.toString(16).padStart(4, '0')
        throw new WsException(`Invalid schedule identity: unsupported control character U+${codePoint}`)
    }

    const identity = target.identity
        .replace(/[\t\r\n]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    if (!identity) {
        throw new WsException('Invalid schedule identity: empty after whitespace normalization')
    }
    if (identity.length > 200) {
        throw new WsException(`Invalid schedule identity: length ${identity.length} exceeds 200 characters`)
    }

    const normalizedIdentity = target.type === 'room'
        ? normalizeRoomListKey(identity)
        : identity.toUpperCase()
    if (!normalizedIdentity) {
        throw new WsException(`Invalid schedule identity: no usable ${target.type} key after normalization`)
    }

    return {
        type: target.type as ScheduleTargetType,
        identity: normalizedIdentity,
    }
}

function getIdentityForLog(value: unknown): string {
    if (typeof value !== 'string') {
        return '<non-string>'
    }

    const preview = value.slice(0, 80)
    return `${JSON.stringify(preview)}${value.length > preview.length ? '…' : ''} (length=${value.length})`
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
        const rooms = new Set<string>()
        for (const target of targets) {
            try {
                rooms.add(getScheduleRoom(normalizeScheduleTarget(target)))
            } catch (error) {
                if (!(error instanceof WsException)) {
                    throw error
                }

                this.logger.warn(
                    `Skipping invalid schedule broadcast target: ${error.message}; `
                    + `type=${JSON.stringify(target?.type)}, identity=${getIdentityForLog(target?.identity)}`,
                )
            }
        }

        if (rooms.size > 0) {
            this.server?.to(Array.from(rooms)).emit('schedule:changed', payload)
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
