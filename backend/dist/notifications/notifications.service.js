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
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_item_mapper_1 = require("../schedule/schedule-item.mapper");
const user_entity_1 = require("../users/entities/user.entity");
const role_entity_1 = require("../users/entities/role.entity");
const notification_entity_1 = require("./notification.entity");
const notifications_gateway_1 = require("./notifications.gateway");
const push_notifications_service_1 = require("./push-notifications.service");
const DAY_LABELS = {
    1: 'понедельник',
    2: 'вторник',
    3: 'среда',
    4: 'четверг',
    5: 'пятница',
    6: 'суббота',
    7: 'воскресенье',
};
const PAIR_NUMBERS = {
    '08:30': '1-я пара',
    '10:15': '2-я пара',
    '12:00': '3-я пара',
    '13:45': '4-я пара',
    '14:15': '4-я пара',
    '15:00': '5-я пара',
    '15:30': '5-я пара',
    '16:00': '5-я пара',
    '17:40': '6-я пара',
    '19:15': '7-я пара',
};
let NotificationsService = NotificationsService_1 = class NotificationsService {
    notificationsRepository;
    usersRepository;
    notificationsGateway;
    pushNotificationsService;
    logger = new common_1.Logger(NotificationsService_1.name);
    constructor(notificationsRepository, usersRepository, notificationsGateway, pushNotificationsService) {
        this.notificationsRepository = notificationsRepository;
        this.usersRepository = usersRepository;
        this.notificationsGateway = notificationsGateway;
        this.pushNotificationsService = pushNotificationsService;
    }
    async listForUser(userId) {
        return this.notificationsRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: 100,
        });
    }
    async markAsRead(userId, id) {
        await this.notificationsRepository.update({ id, userId }, { isRead: true });
    }
    async markAllAsRead(userId) {
        await this.notificationsRepository.update({ userId, isRead: false }, { isRead: true });
    }
    async notifyScheduleUploaded(params) {
        try {
            const students = await this.findStudentsByGroupName(params.groupName, null);
            if (students.length === 0) {
                this.logger.warn(`Schedule upload notification has no recipients: group=${params.groupName}, uploadId=${params.uploadId}`);
                return;
            }
            const title = params.isReplacement ? 'Обновлено расписание' : 'Загружено расписание';
            const message = this.buildScheduleUploadMessage(params);
            const notifications = await this.notificationsRepository.save(students.map((student) => this.notificationsRepository.create({
                userId: student.id,
                type: notification_entity_1.NotificationType.SCHEDULE,
                title,
                message,
                payload: {
                    action: 'schedule-uploaded',
                    groupName: params.groupName.trim(),
                    periodStart: params.periodStart,
                    periodEnd: params.periodEnd,
                    lessonsCount: params.lessonsCount,
                    isReplacement: params.isReplacement,
                    uploadId: params.uploadId,
                },
            })));
            for (const notification of notifications) {
                this.notificationsGateway.sendToUser(notification.userId, notification);
                void this.pushNotificationsService.sendToUser(notification.userId, notification);
            }
        }
        catch (error) {
            this.logger.error(`Failed to send schedule upload notifications: uploadId=${params.uploadId}`, error instanceof Error ? error.stack : String(error));
        }
    }
    async notifyPreholidayDayCreated(date) {
        const recipients = await this.usersRepository.find({
            where: { isActive: true },
        });
        if (recipients.length === 0) {
            this.logger.warn(`Preholiday notification has no recipients: date=${date}`);
            return;
        }
        const message = this.buildPreholidayMessage(date);
        const notifications = await this.notificationsRepository.save(recipients.map((user) => this.notificationsRepository.create({
            userId: user.id,
            type: notification_entity_1.NotificationType.SCHEDULE,
            title: 'Предпраздничный день',
            message,
            payload: {
                action: 'preholiday-created',
                date,
            },
        })));
        for (const notification of notifications) {
            this.notificationsGateway.sendToUser(notification.userId, notification);
            void this.pushNotificationsService.sendToUser(notification.userId, notification);
        }
    }
    async notifyScheduleItemChanged(action, item, previousItem) {
        const recipients = await this.resolveRecipients(item, previousItem);
        if (recipients.length === 0) {
            const currentItem = this.createScheduleItemSnapshot(item);
            this.logger.warn(`Schedule notification has no recipients: itemId=${currentItem.id}, groupId=${currentItem.groupId}, subgroupId=${currentItem.subgroupId}, teacherId=${currentItem.teacherId}`);
            return;
        }
        const currentItem = this.createScheduleItemSnapshot(item);
        const title = this.getScheduleTitle(action);
        const notifications = await this.notificationsRepository.save(recipients.map((user) => {
            const audience = this.getMessageAudience(user);
            const message = this.buildScheduleMessage(action, currentItem, previousItem, audience);
            return this.notificationsRepository.create({
                userId: user.id,
                type: notification_entity_1.NotificationType.SCHEDULE,
                title,
                message,
                payload: {
                    action,
                    scheduleItemId: item.id,
                    groupId: currentItem.groupId,
                    groupName: currentItem.groupName,
                    teacherId: currentItem.teacherId,
                    subgroupId: currentItem.subgroupId,
                    weekStart: currentItem.weekStart,
                    dayOfWeek: currentItem.dayOfWeek,
                    startTime: currentItem.startTime,
                    endTime: currentItem.endTime,
                    changes: previousItem
                        ? this.getScheduleChanges(previousItem, currentItem, audience)
                        : [],
                },
            });
        }));
        for (const notification of notifications) {
            this.notificationsGateway.sendToUser(notification.userId, notification);
            void this.pushNotificationsService.sendToUser(notification.userId, notification);
        }
    }
    createScheduleItemSnapshot(item) {
        return {
            id: item.id,
            groupId: item.schedule?.groupId ?? null,
            groupName: item.schedule?.group?.name ?? null,
            subgroupId: item.subgroupId,
            subgroupNumber: item.subgroup?.number ?? null,
            teacherId: item.teacherId,
            teacherName: (0, schedule_item_mapper_1.resolveTeacherName)(item),
            subject: item.subject?.name ?? '',
            lessonType: item.lessonType?.name ?? '',
            room: (0, schedule_item_mapper_1.formatRoomLabel)(item.room),
            weekStart: String(item.weekStart),
            dayOfWeek: item.dayOfWeek,
            startTime: this.formatTime(item.startTime),
            endTime: this.formatTime(item.endTime),
            comment: item.comment,
        };
    }
    async resolveRecipients(item, previousItem) {
        const recipientIds = new Set();
        const currentItem = this.createScheduleItemSnapshot(item);
        await this.addStudentRecipients(recipientIds, currentItem.groupName, currentItem.subgroupNumber);
        if (previousItem
            && (this.normalizeGroupName(previousItem.groupName)
                !== this.normalizeGroupName(currentItem.groupName)
                || previousItem.subgroupNumber !== currentItem.subgroupNumber)) {
            await this.addStudentRecipients(recipientIds, previousItem.groupName, previousItem.subgroupNumber);
        }
        if (currentItem.teacherId) {
            recipientIds.add(currentItem.teacherId);
        }
        if (previousItem?.teacherId) {
            recipientIds.add(previousItem.teacherId);
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
    async addStudentRecipients(recipientIds, groupName, subgroupNumber) {
        if (!groupName?.trim()) {
            return;
        }
        const students = await this.findStudentsByGroupName(groupName, subgroupNumber);
        const fallbackStudents = subgroupNumber && students.length === 0
            ? await this.findStudentsByGroupName(groupName, null)
            : [];
        for (const student of [...students, ...fallbackStudents]) {
            recipientIds.add(student.id);
        }
    }
    findStudentsByGroupName(groupName, subgroupNumber) {
        const query = this.usersRepository
            .createQueryBuilder('user')
            .innerJoin('user.role', 'role')
            .innerJoin('user.studentProfile', 'studentProfile')
            .innerJoin('studentProfile.group', 'group')
            .leftJoin('studentProfile.subgroup', 'subgroup')
            .where('user.isActive = :isActive', { isActive: true })
            .andWhere('role.code = :roleCode', { roleCode: role_entity_1.RoleCode.STUDENT })
            .andWhere('UPPER(TRIM(group.name)) = UPPER(:groupName)', {
            groupName: groupName.trim(),
        });
        if (subgroupNumber) {
            query.andWhere('subgroup.number = :subgroupNumber', { subgroupNumber });
        }
        return query.getMany();
    }
    normalizeGroupName(groupName) {
        return groupName?.trim().toUpperCase() ?? '';
    }
    getScheduleTitle(action) {
        switch (action) {
            case 'created':
                return 'Добавлена пара';
            case 'updated':
                return 'Изменена пара';
            case 'disabled':
                return 'Пара отменена';
            case 'deleted':
                return 'Пара удалена';
        }
    }
    buildPreholidayMessage(date) {
        const formattedDate = this.formatIsoDate(date);
        if (this.isToday(date)) {
            return 'Сегодня предпраздничный день, пары сокращены.';
        }
        return `${formattedDate} предпраздничный день, пары сокращены.`;
    }
    buildScheduleUploadMessage(params) {
        const group = params.groupName.trim();
        const period = `с ${params.periodStart} по ${params.periodEnd}`;
        const lessonsPart = params.lessonsCount > 0
            ? ` Загружено ${params.lessonsCount} ${this.formatLessonsCountLabel(params.lessonsCount)}.`
            : '';
        if (params.isReplacement) {
            return `Для группы ${group} обновлено расписание за период ${period}.${lessonsPart}`;
        }
        return `Для группы ${group} загружено расписание за период ${period}.${lessonsPart}`;
    }
    formatLessonsCountLabel(count) {
        const mod10 = count % 10;
        const mod100 = count % 100;
        if (mod10 === 1 && mod100 !== 11) {
            return 'занятие';
        }
        if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
            return 'занятия';
        }
        return 'занятий';
    }
    buildScheduleMessage(action, item, previousItem, audience = 'student') {
        const base = this.formatLessonSummary(item);
        if (action === 'updated' && previousItem) {
            return this.buildUpdatedScheduleMessage(previousItem, item, audience) || base;
        }
        if (action === 'created') {
            return this.buildCreatedScheduleMessage(item, audience);
        }
        if (action === 'disabled') {
            return `${base}. Пара отменена`;
        }
        if (action === 'deleted') {
            return `${base}. Пара удалена из расписания`;
        }
        return base;
    }
    buildCreatedScheduleMessage(item, audience) {
        const room = item.room.trim();
        const summary = audience === 'teacher'
            ? this.formatTeacherLessonSummary(item)
            : this.formatLessonSummary(item);
        if (!room) {
            return summary;
        }
        return `${summary}. Кабинет: ${room}`;
    }
    getScheduleChanges(previousItem, item, audience = 'student') {
        const changes = [];
        if (previousItem.weekStart !== item.weekStart
            || previousItem.dayOfWeek !== item.dayOfWeek
            || previousItem.startTime !== item.startTime
            || previousItem.endTime !== item.endTime) {
            changes.push(this.formatTransferMessage(previousItem, item, audience));
        }
        this.addChange(changes, 'Предмет', previousItem.subject, item.subject);
        this.addChange(changes, 'Тип занятия', previousItem.lessonType, item.lessonType);
        if (audience !== 'teacher') {
            this.addChange(changes, 'Преподаватель', previousItem.teacherName, item.teacherName);
        }
        if (previousItem.room.trim() !== item.room.trim()) {
            changes.push(this.formatRoomChangeMessage(item, audience));
        }
        this.addChange(changes, 'Подгруппа', this.formatSubgroup(previousItem.subgroupNumber), this.formatSubgroup(item.subgroupNumber));
        this.addChange(changes, 'Комментарий', previousItem.comment ?? '', item.comment ?? '');
        return changes;
    }
    buildUpdatedScheduleMessage(previousItem, item, audience) {
        const messages = [];
        if (this.isLessonPlacementChanged(previousItem, item)) {
            messages.push(this.formatTransferMessage(previousItem, item, audience));
        }
        if (previousItem.room.trim() !== item.room.trim()) {
            messages.push(this.formatRoomChangeMessage(item, audience));
        }
        this.addChange(messages, 'Предмет', previousItem.subject, item.subject);
        this.addChange(messages, 'Тип занятия', previousItem.lessonType, item.lessonType);
        if (audience !== 'teacher') {
            this.addChange(messages, 'Преподаватель', previousItem.teacherName, item.teacherName);
        }
        this.addChange(messages, 'Подгруппа', this.formatSubgroup(previousItem.subgroupNumber), this.formatSubgroup(item.subgroupNumber));
        this.addChange(messages, 'Комментарий', previousItem.comment ?? '', item.comment ?? '');
        return messages.join(' ');
    }
    isLessonPlacementChanged(previousItem, item) {
        return previousItem.weekStart !== item.weekStart
            || previousItem.dayOfWeek !== item.dayOfWeek
            || previousItem.startTime !== item.startTime
            || previousItem.endTime !== item.endTime;
    }
    formatTransferMessage(previousItem, item, audience) {
        const lesson = this.capitalize(this.formatLessonWithSubject(item));
        const teacher = this.formatTeacherForNotification(item.teacherName);
        const teacherPart = audience !== 'teacher' && teacher
            ? ` у преподавателя ${teacher}`
            : '';
        const groupPart = audience === 'teacher'
            ? ` у группы ${this.formatGroup(item)}`
            : '';
        const subgroup = this.formatSubgroupPart(item);
        const previousDate = this.formatShortLessonDate(previousItem);
        const nextDate = this.formatShortLessonDate(item);
        const previousPair = this.formatPair(previousItem);
        const nextPair = this.formatPair(item);
        const isPairChanged = previousPair !== nextPair || audience === 'teacher';
        const previousPlacement = isPairChanged
            ? `${previousDate}, ${previousPair}`
            : previousDate;
        const nextPlacement = isPairChanged
            ? `${nextDate}, ${nextPair}`
            : nextDate;
        return `${lesson}${teacherPart}${groupPart}${subgroup} перенесена с ${previousPlacement} на ${nextPlacement}.`;
    }
    formatRoomChangeMessage(item, audience) {
        const date = this.formatShortLessonDate(item);
        const lesson = this.formatLessonForRoomChange(item);
        const teacher = this.formatTeacherForNotification(item.teacherName);
        const teacherPart = audience !== 'teacher' && teacher ? ` у ${teacher}` : '';
        const groupPart = audience === 'teacher'
            ? ` у группы ${this.formatGroup(item)}, ${this.formatPair(item)}`
            : '';
        const subgroup = this.formatSubgroupPart(item);
        const room = item.room.trim() || 'кабинет не указан';
        const predicate = room.toLowerCase() === 'дист. форм. об.'
            ? 'будет проведена в'
            : 'будет в';
        return `${date} ${lesson}${teacherPart}${groupPart}${subgroup} ${predicate} ${room}.`;
    }
    formatLessonForRoomChange(item) {
        return this.formatLessonWithSubject(item).toLowerCase();
    }
    addChange(changes, label, previousValue, nextValue) {
        const previous = previousValue.trim() || 'не указано';
        const next = nextValue.trim() || 'не указано';
        if (previous !== next) {
            changes.push(`${label}: ${previous} -> ${next}`);
        }
    }
    formatLessonSummary(item) {
        const type = item.lessonType ? ` (${item.lessonType})` : '';
        const group = item.groupName ?? 'группа не указана';
        const subgroup = item.subgroupNumber ? `, ${this.formatSubgroup(item.subgroupNumber)}` : '';
        return `${item.subject || 'Предмет не указан'}${type}: ${group}${subgroup}, ${this.formatLessonDateTime(item)}`;
    }
    formatTeacherLessonSummary(item) {
        const lesson = this.formatLessonWithSubject(item).toLowerCase();
        const subgroup = this.formatSubgroupPart(item);
        return `${lesson} у группы ${this.formatGroup(item)}${subgroup}, ${this.formatPair(item)}`;
    }
    formatLessonDateTime(item) {
        const day = DAY_LABELS[item.dayOfWeek] ?? 'день не указан';
        const date = this.formatLessonDate(item);
        const pair = PAIR_NUMBERS[item.startTime] ?? `${item.startTime}-${item.endTime}`;
        return `${day}${date ? `, ${date}` : ''}, ${pair} (${item.startTime}-${item.endTime})`;
    }
    formatLessonDate(item) {
        const [year, month, day] = item.weekStart.slice(0, 10).split('-').map(Number);
        if (!year || !month || !day || !item.dayOfWeek) {
            return '';
        }
        const lessonDate = new Date(Date.UTC(year, month - 1, day + item.dayOfWeek - 1));
        const formattedDay = String(lessonDate.getUTCDate()).padStart(2, '0');
        const formattedMonth = String(lessonDate.getUTCMonth() + 1).padStart(2, '0');
        return `${formattedDay}.${formattedMonth}.${lessonDate.getUTCFullYear()}`;
    }
    formatShortLessonDate(item) {
        const [day, month] = this.formatLessonDate(item).split('.');
        if (!day || !month) {
            return 'дата не указана';
        }
        return `${day}.${month}`;
    }
    formatPair(item) {
        return PAIR_NUMBERS[item.startTime] ?? 'пара не указана';
    }
    formatLessonType(item) {
        return item.lessonType.trim() || item.subject.trim() || 'пара';
    }
    formatLessonWithSubject(item) {
        const lessonType = this.formatLessonType(item);
        const subject = item.subject.trim();
        if (!subject || lessonType.toLowerCase() === subject.toLowerCase()) {
            return lessonType;
        }
        return `${lessonType} по ${subject}`;
    }
    formatTeacherForNotification(value) {
        return value.trim().replace(/[\s.]+/g, '');
    }
    formatGroup(item) {
        return item.groupName?.trim() || 'группа не указана';
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
    capitalize(value) {
        const trimmed = value.trim();
        if (!trimmed) {
            return '';
        }
        return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1).toLowerCase()}`;
    }
    formatSubgroup(value) {
        return value ? `${value} подгруппа` : 'общая пара';
    }
    formatSubgroupPart(item) {
        return item.subgroupNumber ? ` для ${item.subgroupNumber} подгруппы` : '';
    }
    formatTime(value) {
        return String(value).slice(0, 5);
    }
    formatIsoDate(value) {
        const [year, month, day] = value.slice(0, 10).split('-');
        if (!year || !month || !day) {
            return value;
        }
        return `${day}.${month}.${year}`;
    }
    isToday(value) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return value.slice(0, 10) === `${year}-${month}-${day}`;
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_gateway_1.NotificationsGateway,
        push_notifications_service_1.PushNotificationsService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map