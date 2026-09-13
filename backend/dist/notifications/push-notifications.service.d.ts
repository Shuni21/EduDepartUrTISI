import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Notification } from './notification.entity';
import { PushSubscriptionsService } from './push-subscriptions.service';
export declare class PushNotificationsService implements OnModuleInit {
    private readonly configService;
    private readonly pushSubscriptionsService;
    private readonly logger;
    private enabled;
    constructor(configService: ConfigService, pushSubscriptionsService: PushSubscriptionsService);
    onModuleInit(): void;
    getPublicKey(): string | null;
    isEnabled(): boolean;
    sendToUser(userId: number, notification: Notification): Promise<void>;
    private sendToSubscription;
    private getStatusCode;
    private getErrorMessage;
}
