import { OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
export type ScheduleChangedPayload = {
    reason: 'item-created' | 'item-updated' | 'item-disabled' | 'item-deleted' | 'preholiday-updated' | 'schedule-uploaded' | 'schedule-upload-deleted';
};
export type ScheduleTargetType = 'group' | 'teacher' | 'room';
export type ScheduleTarget = {
    type: ScheduleTargetType;
    identity: string;
};
export declare class ScheduleGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger;
    server: Server;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    subscribeToSchedule(client: Socket, value: unknown): Promise<void>;
    unsubscribeFromSchedule(client: Socket, value: unknown): Promise<void>;
    broadcastScheduleChanged(payload: ScheduleChangedPayload, targets: ScheduleTarget[]): void;
    broadcastGlobalScheduleChanged(payload: ScheduleChangedPayload): void;
    broadcastPreholidayDaysUpdated(preholidayDays: string[]): void;
}
