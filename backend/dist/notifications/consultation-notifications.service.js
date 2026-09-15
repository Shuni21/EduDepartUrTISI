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
var ConsultationNotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsultationNotificationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_item_mapper_1 = require("../schedule/schedule-item.mapper");
const role_entity_1 = require("../users/entities/role.entity");
const user_entity_1 = require("../users/entities/user.entity");
const consultation_notification_preferences_service_1 = require("./consultation-notification-preferences.service");
const notification_entity_1 = require("./notification.entity");
const notifications_gateway_1 = require("./notifications.gateway");
const push_notifications_service_1 = require("./push-notifications.service");
const CONSULTATION_DAY_LABELS = {
    1: 'понедельник',
    2: 'вторник',
    3: 'среда',
    4: 'четверг',
    5: 'пятница',
    6: 'суббота',
    7: 'воскресенье',
};
let ConsultationNotificationsService = ConsultationNotificationsService_1 = class ConsultationNotificationsService {
    notificationsRepository;
    usersRepository;
    notificationsGateway;
    pushNotificationsService;
    consultationNotificationPreferencesService;
    logger = new common_1.Logger(ConsultationNotificationsService_1.name);
    constructor(notificationsRepository, usersRepository, notificationsGateway, pushNotificationsService, consultationNotificationPreferencesService) {
        this.notificationsRepository = notificationsRepository;
        this.usersRepository = usersRepository;
        this.notificationsGateway = notificationsGateway;
        this.pushNotificationsService = pushNotificationsService;
        this.consultationNotificationPreferencesService = consultationNotificationPreferencesService;
    }
    createConsultationSnapshot(consultation) {
        return {
            id: consultation.id,
            departmentId: consultation.departmentId,
            teacherId: consultation.teacherId,
            teacherName: consultation.teacher
                ? (0, schedule_item_mapper_1.formatTeacherName)(consultation.teacher)
                : '',
            subject: consultation.subject,
            consultationType: consultation.consultationType,
            dayOfWeek: consultation.dayOfWeek,
            startTime: this.formatTime(consultation.startTime),
            endTime: this.formatTime(consultation.endTime),
            weekStart: String(consultation.weekStart),
            room: consultation.room,
            comment: consultation.comment,
        };
    }
    async notifyConsultationChanged(action, consultation, previousItem) {
        const currentItem = this.createConsultationSnapshot(consultation);
        if (action === 'updated'
            && previousItem
            && !this.hasConsultationChanges(previousItem, currentItem)) {
            return;
        }
        const recipients = await this.resolveConsultationRecipients(currentItem.teacherId, previousItem?.teacherId);
        if (recipients.length === 0) {
            this.logger.warn(`Consultation notification has no recipients: consultationId=${currentItem.id}, teacherId=${currentItem.teacherId}`);
            return;
        }
        const title = this.getConsultationTitle(action);
        const notifications = await this.notificationsRepository.save(recipients.map((user) => {
            const audience = this.getMessageAudience(user);
            return this.notificationsRepository.create({
                userId: user.id,
                type: notification_entity_1.NotificationType.CONSULTATION,
                title,
                message: this.buildConsultationMessage(action, currentItem, previousItem, audience),
                payload: {
                    action,
                    consultationId: consultation.id,
                    departmentId: currentItem.departmentId,
                    teacherId: currentItem.teacherId,
                    weekStart: currentItem.weekStart,
                    dayOfWeek: currentItem.dayOfWeek,
                    startTime: currentItem.startTime,
                    endTime: currentItem.endTime,
                    changes: previousItem
                        ? this.getConsultationChanges(previousItem, currentItem, audience)
                        : [],
                },
            });
        }));
        await Promise.all(notifications.map(async (notification) => {
            this.notificationsGateway.sendToUser(notification.userId, notification);
            try {
                await this.pushNotificationsService.sendToUser(notification.userId, notification);
            }
            catch (error) {
                this.logger.error(`Failed to send consultation push notification: notificationId=${notification.id}`, error instanceof Error ? error.stack : String(error));
            }
        }));
    }
    async resolveConsultationRecipients(teacherId, previousTeacherId) {
        const recipientIds = new Set();
        const subscriberIds = await this.consultationNotificationPreferencesService
            .findSubscriberUserIds(teacherId);
        for (const userId of subscriberIds) {
            recipientIds.add(userId);
        }
        recipientIds.add(teacherId);
        if (previousTeacherId && previousTeacherId !== teacherId) {
            recipientIds.add(previousTeacherId);
            const previousSubscriberIds = await this.consultationNotificationPreferencesService
                .findSubscriberUserIds(previousTeacherId);
            for (const userId of previousSubscriberIds) {
                recipientIds.add(userId);
            }
        }
        if (recipientIds.size === 0) {
            return [];
        }
        return this.usersRepository.find({
            where: {
                id: (0, typeorm_2.In)([...recipientIds]),
                isActive: true,
            },
            relations: ['role'],
        });
    }
    hasConsultationChanges(previousItem, currentItem) {
        return previousItem.subject !== currentItem.subject
            || previousItem.consultationType !== currentItem.consultationType
            || previousItem.teacherId !== currentItem.teacherId
            || previousItem.dayOfWeek !== currentItem.dayOfWeek
            || previousItem.startTime !== currentItem.startTime
            || previousItem.endTime !== currentItem.endTime
            || previousItem.weekStart !== currentItem.weekStart
            || (previousItem.room ?? '') !== (currentItem.room ?? '')
            || (previousItem.comment ?? '') !== (currentItem.comment ?? '');
    }
    getConsultationTitle(action) {
        switch (action) {
            case 'created':
                return 'Добавлена консультация';
            case 'updated':
                return 'Изменена консультация';
            case 'deleted':
                return 'Отмена консультации';
        }
    }
    buildConsultationMessage(action, item, previousItem, audience = 'student') {
        const summary = this.formatConsultationSummary(item, audience);
        if (action === 'created') {
            return summary;
        }
        if (action === 'deleted') {
            return `${summary}. Отмена консультации`;
        }
        if (action === 'updated' && previousItem) {
            const changes = this.buildUpdatedConsultationMessage(previousItem, item, audience);
            return changes || summary;
        }
        return summary;
    }
    buildUpdatedConsultationMessage(previousItem, item, audience) {
        const messages = [];
        if (this.isConsultationPlacementChanged(previousItem, item)) {
            messages.push(this.formatConsultationTransferMessage(previousItem, item, audience));
        }
        this.addChange(messages, 'Предмет', previousItem.subject, item.subject);
        this.addChange(messages, 'Тип', previousItem.consultationType, item.consultationType);
        if (audience !== 'teacher') {
            this.addChange(messages, 'Преподаватель', previousItem.teacherName, item.teacherName);
        }
        if ((previousItem.room ?? '').trim() !== (item.room ?? '').trim()) {
            const room = item.room?.trim() || 'кабинет не указан';
            messages.push(`Кабинет: ${room}`);
        }
        this.addChange(messages, 'Комментарий', previousItem.comment ?? '', item.comment ?? '');
        return messages.join(' ');
    }
    getConsultationChanges(previousItem, item, audience) {
        const changes = [];
        if (this.isConsultationPlacementChanged(previousItem, item)) {
            changes.push(this.formatConsultationTransferMessage(previousItem, item, audience));
        }
        this.addChange(changes, 'Предмет', previousItem.subject, item.subject);
        this.addChange(changes, 'Тип', previousItem.consultationType, item.consultationType);
        if (audience !== 'teacher') {
            this.addChange(changes, 'Преподаватель', previousItem.teacherName, item.teacherName);
        }
        this.addChange(changes, 'Кабинет', previousItem.room ?? '', item.room ?? '');
        this.addChange(changes, 'Комментарий', previousItem.comment ?? '', item.comment ?? '');
        return changes;
    }
    isConsultationPlacementChanged(previousItem, item) {
        return previousItem.weekStart !== item.weekStart
            || previousItem.dayOfWeek !== item.dayOfWeek
            || previousItem.startTime !== item.startTime
            || previousItem.endTime !== item.endTime;
    }
    formatConsultationTransferMessage(previousItem, item, audience) {
        const consultation = this.capitalize(this.formatConsultationWithSubject(item));
        const teacher = this.formatTeacherForNotification(item.teacherName);
        const teacherPart = audience !== 'teacher' && teacher
            ? ` у преподавателя ${teacher}`
            : '';
        const previousDate = this.formatConsultationShortDate(previousItem);
        const nextDate = this.formatConsultationShortDate(item);
        const previousTime = `${previousItem.startTime}-${previousItem.endTime}`;
        const nextTime = `${item.startTime}-${item.endTime}`;
        return `${consultation}${teacherPart} перенесена с ${previousDate}, ${previousTime} на ${nextDate}, ${nextTime}.`;
    }
    formatConsultationSummary(item, audience) {
        const consultation = this.capitalize(this.formatConsultationWithSubject(item));
        const teacherPart = audience !== 'teacher' && item.teacherName.trim()
            ? ` у ${item.teacherName.trim()}`
            : '';
        const dateTime = this.formatConsultationDateTime(item);
        const room = item.room?.trim();
        if (!room) {
            return `${consultation}${teacherPart}, ${dateTime}`;
        }
        return `${consultation}${teacherPart}, ${dateTime}. Кабинет: ${room}`;
    }
    formatConsultationWithSubject(item) {
        const type = item.consultationType.trim() || 'консультация';
        const subject = item.subject.trim();
        if (!subject || type.toLowerCase() === subject.toLowerCase()) {
            return type.toLowerCase();
        }
        return `${type.toLowerCase()} по ${subject}`;
    }
    formatConsultationDateTime(item) {
        const day = CONSULTATION_DAY_LABELS[item.dayOfWeek] ?? 'день не указан';
        const date = this.formatConsultationDate(item);
        return `${day}${date ? `, ${date}` : ''}, ${item.startTime}-${item.endTime}`;
    }
    formatConsultationDate(item) {
        const [year, month, day] = item.weekStart.slice(0, 10).split('-').map(Number);
        if (!year || !month || !day || !item.dayOfWeek) {
            return '';
        }
        const lessonDate = new Date(Date.UTC(year, month - 1, day + item.dayOfWeek - 1));
        const formattedDay = String(lessonDate.getUTCDate()).padStart(2, '0');
        const formattedMonth = String(lessonDate.getUTCMonth() + 1).padStart(2, '0');
        return `${formattedDay}.${formattedMonth}.${lessonDate.getUTCFullYear()}`;
    }
    formatConsultationShortDate(item) {
        const [day, month] = this.formatConsultationDate(item).split('.');
        if (!day || !month) {
            return 'дата не указана';
        }
        return `${day}.${month}`;
    }
    getMessageAudience(user) {
        if (user.role?.code === role_entity_1.RoleCode.TEACHER) {
            return 'teacher';
        }
        if (user.role?.code === role_entity_1.RoleCode.STUDENT) {
            return 'student';
        }
        return 'other';
    }
    formatTeacherForNotification(value) {
        return value.trim().replace(/[\s.]+/g, '');
    }
    capitalize(value) {
        const trimmed = value.trim();
        if (!trimmed) {
            return '';
        }
        return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1).toLowerCase()}`;
    }
    addChange(changes, label, previousValue, nextValue) {
        const previous = previousValue.trim() || 'не указано';
        const next = nextValue.trim() || 'не указано';
        if (previous !== next) {
            changes.push(`${label}: ${previous} -> ${next}`);
        }
    }
    formatTime(value) {
        return String(value).slice(0, 5);
    }
};
exports.ConsultationNotificationsService = ConsultationNotificationsService;
exports.ConsultationNotificationsService = ConsultationNotificationsService = ConsultationNotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_gateway_1.NotificationsGateway,
        push_notifications_service_1.PushNotificationsService,
        consultation_notification_preferences_service_1.ConsultationNotificationPreferencesService])
], ConsultationNotificationsService);
//# sourceMappingURL=consultation-notifications.service.js.map