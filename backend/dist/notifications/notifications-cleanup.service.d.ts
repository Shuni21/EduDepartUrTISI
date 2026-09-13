import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
export declare class NotificationsCleanupService implements OnModuleInit, OnModuleDestroy {
    private readonly notificationsRepository;
    private static readonly RETENTION_DAYS;
    private static readonly CLEANUP_INTERVAL_MS;
    private readonly logger;
    private cleanupTimer;
    constructor(notificationsRepository: Repository<Notification>);
    onModuleInit(): void;
    onModuleDestroy(): void;
    cleanupExpiredNotifications(): Promise<number>;
}
