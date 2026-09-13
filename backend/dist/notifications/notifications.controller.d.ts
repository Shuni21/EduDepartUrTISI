import { Request } from 'express';
import { ConsultationNotificationPreferencesService } from './consultation-notification-preferences.service';
import { UpdateConsultationNotificationPreferenceDto } from './dto/consultation-notification-preference.dto';
import { PushSubscriptionDto, UnsubscribePushDto } from './dto/push-subscription.dto';
import { Notification } from './notification.entity';
import { NotificationsService } from './notifications.service';
import { PushNotificationsService } from './push-notifications.service';
import { PushSubscriptionsService } from './push-subscriptions.service';
type AuthRequest = Request & {
    user: {
        sub?: number;
        id?: number;
    };
};
export declare class NotificationsController {
    private readonly notificationsService;
    private readonly pushNotificationsService;
    private readonly pushSubscriptionsService;
    private readonly consultationNotificationPreferencesService;
    constructor(notificationsService: NotificationsService, pushNotificationsService: PushNotificationsService, pushSubscriptionsService: PushSubscriptionsService, consultationNotificationPreferencesService: ConsultationNotificationPreferencesService);
    list(request: AuthRequest): Promise<Notification[]>;
    listConsultationTeacherOptions(): Promise<import("./dto/consultation-notification-preference.dto").ConsultationTeacherOption[]>;
    getConsultationPreferences(request: AuthRequest): Promise<import("./dto/consultation-notification-preference.dto").ConsultationNotificationPreferenceResponse>;
    updateConsultationPreferences(request: AuthRequest, dto: UpdateConsultationNotificationPreferenceDto): Promise<import("./dto/consultation-notification-preference.dto").ConsultationNotificationPreferenceResponse>;
    getVapidPublicKey(): {
        publicKey: string | null;
        enabled: boolean;
    };
    getPushStatus(request: AuthRequest, endpoint?: string): Promise<{
        subscribed: boolean;
    }>;
    subscribe(request: AuthRequest, dto: PushSubscriptionDto): Promise<void>;
    unsubscribe(request: AuthRequest, dto: UnsubscribePushDto): Promise<void>;
    markAllAsRead(request: AuthRequest): Promise<void>;
    markAsRead(request: AuthRequest, id: number): Promise<void>;
    private getUserId;
}
export {};
