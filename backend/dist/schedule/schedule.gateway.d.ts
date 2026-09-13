import { OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
export type ScheduleChangedPayload = {
    reason: 'item-created' | 'item-updated' | 'item-disabled' | 'item-deleted' | 'preholiday-updated' | 'schedule-uploaded';
};
export declare class ScheduleGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger;
    server: Server;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    broadcastScheduleChanged(payload: ScheduleChangedPayload): void;
    broadcastPreholidayDaysUpdated(preholidayDays: string[]): void;
}
