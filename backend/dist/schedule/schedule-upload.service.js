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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleUploadService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const typeorm_2 = require("typeorm");
const storage_1 = require("../config/storage");
const schedule_upload_entity_1 = require("./entities/schedule-upload.entity");
const schedule_entity_1 = require("./entities/schedule.entity");
const schedule_item_entity_1 = require("./entities/schedule-item.entity");
const excel_grid_parser_1 = require("./parser/excel-grid.parser");
const schedule_conflict_validator_1 = require("./parser/schedule-conflict.validator");
const schedule_import_service_1 = require("./schedule-import.service");
const schedule_item_mapper_1 = require("./schedule-item.mapper");
const notifications_service_1 = require("../notifications/notifications.service");
const schedule_notifier_service_1 = require("./schedule-notifier.service");
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/csv',
]);
const ALLOWED_EXTENSIONS = new Set(['.xlsx', '.xls', '.csv']);
const DAY_LABELS = {
    1: 'ПН',
    2: 'ВТ',
    3: 'СР',
    4: 'ЧТ',
    5: 'ПТ',
    6: 'СБ',
    7: 'ВС',
};
function isConflictWarning(warning) {
    return warning.startsWith('Конфликт аудитории между группами:')
        || warning.startsWith('Конфликт преподавателя:');
}
function decodeUploadedFilename(name) {
    if (/[\u0400-\u04FF]/.test(name)) {
        return name;
    }
    try {
        return Buffer.from(name, 'latin1').toString('utf8');
    }
    catch {
        return name;
    }
}
function normalizeStoredFileName(originalFileName) {
    const decoded = decodeUploadedFilename(originalFileName).trim();
    const extension = (0, node_path_1.extname)(decoded);
    const baseName = decoded.slice(0, decoded.length - extension.length).trim() || 'upload';
    const safeBaseName = baseName
        .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
        .replace(/\s+/g, ' ')
        .replace(/[. ]+$/g, '')
        .trim() || 'upload';
    const safeExtension = extension.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_');
    return `${safeBaseName}${safeExtension}`;
}
let ScheduleUploadService = class ScheduleUploadService {
    uploadsRepository;
    itemsRepository;
    schedulesRepository;
    scheduleImportService;
    notificationsService;
    scheduleNotifier;
    schedulesDir = (0, storage_1.getSchedulesDir)();
    constructor(uploadsRepository, itemsRepository, schedulesRepository, scheduleImportService, notificationsService, scheduleNotifier) {
        this.uploadsRepository = uploadsRepository;
        this.itemsRepository = itemsRepository;
        this.schedulesRepository = schedulesRepository;
        this.scheduleImportService = scheduleImportService;
        this.notificationsService = notificationsService;
        this.scheduleNotifier = scheduleNotifier;
    }
    async previewSchedule(uploadedById, scheduleTypeRaw, expectedGroupNameRaw, facultyNameRaw, file) {
        this.assertValidUpload(file);
        const originalFileName = decodeUploadedFilename(file.originalname);
        this.parseScheduleType(scheduleTypeRaw);
        const expectedGroupName = this.parseRequiredGroupName(expectedGroupNameRaw);
        this.parseFacultyName(facultyNameRaw);
        const extension = (0, node_path_1.extname)(originalFileName).toLowerCase();
        if (extension === '.csv') {
            throw new common_1.BadRequestException('Парсер поддерживает только Excel (.xlsx, .xls). Загрузите файл в формате Excel.');
        }
        const parsed = this.parseUploadedWorkbook(file.buffer);
        this.assertGroupMatches(expectedGroupName, parsed.groupName);
        this.assertPeriodDefined(parsed.periodStart, parsed.periodEnd);
        const obsoleteUploads = await this.findPeriodUploads(uploadedById, parsed.groupName, parsed.periodStart, parsed.periodEnd);
        const obsoleteUploadIds = obsoleteUploads.map((u) => u.id);
        const excludePeriod = {
            validFrom: this.toDate(parsed.periodStart),
            validTo: this.toDate(parsed.periodEnd),
        };
        const existingSameGroupLessons = await this.loadExistingLessons(parsed.groupName, obsoleteUploadIds, excludePeriod);
        const otherGroupsLessons = await this.loadOtherGroupsLessons(parsed.groupName, obsoleteUploadIds);
        const allExisting = [...existingSameGroupLessons, ...otherGroupsLessons];
        const conflictByIndex = new Map();
        parsed.lessons.forEach((lesson, index) => {
            const conflicts = (0, schedule_conflict_validator_1.validateScheduleConflicts)([lesson], allExisting);
            const relevant = conflicts.filter((c) => c.message.includes(parsed.groupName));
            if (relevant.length > 0) {
                conflictByIndex.set(index, relevant.map((c) => c.message).join('; '));
            }
        });
        const lessons = parsed.lessons.map((lesson, index) => ({
            index,
            dayOfWeek: lesson.dayOfWeek,
            dayLabel: DAY_LABELS[lesson.dayOfWeek] ?? String(lesson.dayOfWeek),
            startTime: lesson.startTime,
            endTime: lesson.endTime,
            subject: lesson.subject,
            teacherName: lesson.teacherName || undefined,
            room: lesson.room || undefined,
            subgroup: lesson.subgroup ?? null,
            hasConflict: conflictByIndex.has(index),
            conflictReason: conflictByIndex.get(index),
        }));
        return {
            lessons,
            periodStart: parsed.periodStart,
            periodEnd: parsed.periodEnd,
            parseWarnings: parsed.warnings.length > 0 ? parsed.warnings : undefined,
            groupName: parsed.groupName,
        };
    }
    async confirmSchedule(uploadedById, scheduleTypeRaw, expectedGroupNameRaw, facultyNameRaw, file, selectedIndexes) {
        this.assertValidUpload(file);
        if (!Array.isArray(selectedIndexes) || selectedIndexes.length === 0) {
            throw new common_1.BadRequestException('Не выбрано ни одной пары для загрузки');
        }
        const originalFileName = decodeUploadedFilename(file.originalname);
        const scheduleType = this.parseScheduleType(scheduleTypeRaw);
        const expectedGroupName = this.parseRequiredGroupName(expectedGroupNameRaw);
        const facultyName = this.parseFacultyName(facultyNameRaw);
        const extension = (0, node_path_1.extname)(originalFileName).toLowerCase();
        if (extension === '.csv') {
            throw new common_1.BadRequestException('Парсер поддерживает только Excel (.xlsx, .xls). Загрузите файл в формате Excel.');
        }
        const parsed = this.parseUploadedWorkbook(file.buffer);
        this.assertGroupMatches(expectedGroupName, parsed.groupName);
        this.assertPeriodDefined(parsed.periodStart, parsed.periodEnd);
        const indexSet = new Set(selectedIndexes.filter((i) => Number.isInteger(i) && i >= 0 && i < parsed.lessons.length));
        const selectedLessons = parsed.lessons.filter((_, i) => indexSet.has(i));
        if (selectedLessons.length === 0) {
            throw new common_1.BadRequestException('Не выбрано ни одной валидной пары');
        }
        const obsoleteUploads = await this.findPeriodUploads(uploadedById, parsed.groupName, parsed.periodStart, parsed.periodEnd);
        const obsoleteUploadIds = obsoleteUploads.map((u) => u.id);
        const excludePeriod = {
            validFrom: this.toDate(parsed.periodStart),
            validTo: this.toDate(parsed.periodEnd),
        };
        const existingSameGroupLessons = await this.loadExistingLessons(parsed.groupName, obsoleteUploadIds, excludePeriod);
        const otherGroupsLessons = await this.loadOtherGroupsLessons(parsed.groupName, obsoleteUploadIds);
        const conflicts = (0, schedule_conflict_validator_1.validateScheduleConflicts)(selectedLessons, [...existingSameGroupLessons, ...otherGroupsLessons]);
        const conflictWarnings = conflicts
            .map((c) => c.message)
            .filter((msg) => msg.includes(parsed.groupName));
        const allWarnings = parsed.warnings.filter((warning) => !isConflictWarning(warning));
        const storedFileName = normalizeStoredFileName(originalFileName);
        const filePath = (0, node_path_1.join)(this.schedulesDir, storedFileName);
        const fileUrl = `/uploads/schedules/${storedFileName}`;
        await (0, promises_1.writeFile)(filePath, file.buffer);
        await this.removeUploads(obsoleteUploads);
        const upload = this.uploadsRepository.create({
            scheduleType,
            originalFileName,
            storedFileName,
            fileUrl,
            mimeType: file.mimetype || 'application/octet-stream',
            fileSize: file.size,
            groupName: parsed.groupName,
            facultyName,
            parseStatus: schedule_upload_entity_1.ScheduleParseStatus.SUCCESS,
            parseErrors: null,
            parseWarnings: allWarnings.length > 0 ? allWarnings : null,
            lessonsCount: selectedLessons.length,
            periodStart: parsed.periodStart,
            periodEnd: parsed.periodEnd,
            uploadedById,
        });
        const savedUpload = await this.uploadsRepository.save(upload);
        const filteredParsed = {
            ...parsed,
            lessons: selectedLessons,
        };
        const importResult = await this.scheduleImportService.importParsedSchedule(filteredParsed, savedUpload);
        savedUpload.lessonsCount = importResult.itemsCount;
        const mergedWarnings = [
            ...allWarnings,
            ...importResult.warnings,
        ];
        savedUpload.parseWarnings = mergedWarnings.length > 0 ? mergedWarnings : null;
        await this.uploadsRepository.save(savedUpload);
        const uploadWithUser = await this.uploadsRepository.findOne({
            where: { id: savedUpload.id },
            relations: ['uploadedBy'],
        });
        if (!uploadWithUser) {
            throw new common_1.NotFoundException('Загруженный файл не найден');
        }
        this.scheduleNotifier.notifyScheduleChanged('schedule-uploaded');
        await this.notificationsService.notifyScheduleUploaded({
            groupName: parsed.groupName,
            periodStart: parsed.periodStart,
            periodEnd: parsed.periodEnd,
            lessonsCount: savedUpload.lessonsCount,
            isReplacement: obsoleteUploads.length > 0,
            uploadId: savedUpload.id,
        });
        return this.toResponse(uploadWithUser);
    }
    async onModuleInit() {
        await (0, promises_1.mkdir)(this.schedulesDir, { recursive: true });
    }
    assertValidUpload(file) {
        if (!file) {
            throw new common_1.BadRequestException('Файл расписания обязателен');
        }
        const extension = (0, node_path_1.extname)(decodeUploadedFilename(file.originalname)).toLowerCase();
        if (!ALLOWED_EXTENSIONS.has(extension)) {
            throw new common_1.BadRequestException('Допустимы только файлы Excel (.xlsx, .xls) или CSV');
        }
        if (file.mimetype
            && !ALLOWED_MIME_TYPES.has(file.mimetype)
            && file.mimetype !== 'application/octet-stream') {
            throw new common_1.BadRequestException('Некорректный тип файла. Загрузите Excel или CSV');
        }
        if (file.size > MAX_FILE_SIZE) {
            throw new common_1.BadRequestException('Размер файла не должен превышать 20 МБ');
        }
    }
    parseScheduleType(value) {
        const scheduleType = String(value ?? '').trim();
        if (!Object.values(schedule_entity_1.ScheduleType).includes(scheduleType)) {
            throw new common_1.BadRequestException('Некорректный тип расписания');
        }
        return scheduleType;
    }
    parseRequiredGroupName(value) {
        const groupName = String(value ?? '').trim();
        if (!groupName) {
            throw new common_1.BadRequestException('Выберите группу перед загрузкой');
        }
        return groupName;
    }
    parseFacultyName(value) {
        const facultyName = String(value ?? '').trim();
        if (!facultyName) {
            throw new common_1.BadRequestException('Выберите факультет перед загрузкой');
        }
        return facultyName;
    }
    normalizeGroupName(value) {
        return value.trim().toUpperCase();
    }
    toDate(value) {
        const [day, month, year] = value.split('.');
        const pad = (part) => part.padStart(2, '0');
        return `${year}-${pad(month)}-${pad(day)}`;
    }
    assertGroupMatches(expectedGroupName, parsedGroupName) {
        if (this.normalizeGroupName(expectedGroupName) !== this.normalizeGroupName(parsedGroupName)) {
            throw new common_1.BadRequestException({
                message: 'Группа в файле не совпадает с выбранной',
                errors: [
                    `Выбрана группа: ${expectedGroupName}`,
                    `В файле указана группа: ${parsedGroupName}`,
                ],
            });
        }
    }
    assertPeriodDefined(periodStart, periodEnd) {
        if (!periodStart || !periodEnd) {
            throw new common_1.BadRequestException({
                message: 'В шапке файла не найден период расписания',
                errors: [
                    'Добавьте в шапку Excel период, например: на период с 01.09.26г. по 10.10.26г.',
                ],
            });
        }
    }
    parseUploadedWorkbook(buffer) {
        try {
            return (0, excel_grid_parser_1.parseScheduleWorkbook)(buffer);
        }
        catch (error) {
            const parseError = error instanceof Error && error.message
                ? error.message
                : 'Не удалось разобрать файл расписания';
            throw new common_1.BadRequestException({
                message: 'Не удалось разобрать файл расписания',
                errors: [parseError],
            });
        }
    }
    async findPeriodUploads(uploadedById, groupName, periodStart, periodEnd) {
        return this.uploadsRepository.find({
            where: {
                uploadedById,
                groupName,
                periodStart,
                periodEnd,
                parseStatus: schedule_upload_entity_1.ScheduleParseStatus.SUCCESS,
            },
            select: ['id', 'storedFileName'],
        });
    }
    async deleteSchedulesByUploadIds(uploadIds) {
        if (uploadIds.length === 0) {
            return;
        }
        await this.schedulesRepository.delete({
            uploadId: (0, typeorm_2.In)(uploadIds),
        });
    }
    async findLatestAlternativeUpload(groupName, periodStart, periodEnd, excludeUploadId) {
        return this.uploadsRepository
            .createQueryBuilder('upload')
            .where('upload.groupName = :groupName', { groupName })
            .andWhere('upload.periodStart = :periodStart', { periodStart })
            .andWhere('upload.periodEnd = :periodEnd', { periodEnd })
            .andWhere('upload.parseStatus = :status', { status: schedule_upload_entity_1.ScheduleParseStatus.SUCCESS })
            .andWhere('upload.id != :excludeUploadId', { excludeUploadId })
            .orderBy('upload.uploadedAt', 'DESC')
            .getOne();
    }
    async reimportFromStoredUpload(upload) {
        const filePath = (0, node_path_1.join)(this.schedulesDir, upload.storedFileName);
        const buffer = await (0, promises_1.readFile)(filePath);
        const parsed = (0, excel_grid_parser_1.parseScheduleWorkbook)(buffer);
        const importResult = await this.scheduleImportService.importParsedSchedule(parsed, upload);
        upload.lessonsCount = importResult.itemsCount;
        upload.parseWarnings = importResult.warnings.length > 0
            ? importResult.warnings
            : null;
        await this.uploadsRepository.save(upload);
    }
    async handleOwnedSchedulesBeforeUploadDelete(upload) {
        const ownedSchedule = await this.schedulesRepository.findOne({
            where: { uploadId: upload.id },
        });
        if (!ownedSchedule) {
            return;
        }
        if (!upload.groupName || !upload.periodStart || !upload.periodEnd) {
            await this.deleteSchedulesByUploadIds([upload.id]);
            return;
        }
        const alternativeUpload = await this.findLatestAlternativeUpload(upload.groupName, upload.periodStart, upload.periodEnd, upload.id);
        if (!alternativeUpload) {
            await this.deleteSchedulesByUploadIds([upload.id]);
            return;
        }
        try {
            await this.reimportFromStoredUpload(alternativeUpload);
        }
        catch {
            await this.deleteSchedulesByUploadIds([upload.id]);
        }
    }
    async removeUploads(uploads) {
        const uploadIds = uploads.map((upload) => upload.id);
        await this.deleteSchedulesByUploadIds(uploadIds);
        for (const obsoleteUpload of uploads) {
            const obsoletePath = (0, node_path_1.join)(this.schedulesDir, obsoleteUpload.storedFileName);
            try {
                await (0, promises_1.unlink)(obsoletePath);
            }
            catch {
            }
        }
        if (uploads.length > 0) {
            await this.uploadsRepository.delete({
                id: (0, typeorm_2.In)(uploadIds),
            });
        }
    }
    toResponse(upload) {
        return {
            id: upload.id,
            scheduleType: upload.scheduleType,
            originalFileName: decodeUploadedFilename(upload.originalFileName),
            fileUrl: upload.fileUrl,
            mimeType: upload.mimeType,
            fileSize: upload.fileSize,
            groupName: upload.groupName,
            facultyName: upload.facultyName,
            parseStatus: upload.parseStatus,
            parseErrors: upload.parseErrors,
            parseWarnings: upload.parseWarnings?.filter((warning) => !isConflictWarning(warning)) ?? null,
            lessonsCount: upload.lessonsCount,
            periodStart: upload.periodStart,
            periodEnd: upload.periodEnd,
            uploadedAt: upload.uploadedAt.toISOString(),
            uploadedBy: {
                id: upload.uploadedBy.id,
                surname: upload.uploadedBy.surname,
                name: upload.uploadedBy.name,
                patronymic: upload.uploadedBy.patronymic,
            },
        };
    }
    async loadScheduleItems(excludeUploadIds = [], groupName, excludePeriod) {
        const qb = this.itemsRepository
            .createQueryBuilder('item')
            .innerJoinAndSelect('item.schedule', 'schedule')
            .innerJoinAndSelect('schedule.group', 'group')
            .leftJoinAndSelect('item.subject', 'subject')
            .leftJoinAndSelect('item.subgroup', 'subgroup')
            .leftJoinAndSelect('item.lessonType', 'lessonType')
            .leftJoinAndSelect('item.teacher', 'teacher')
            .leftJoinAndSelect('item.room', 'room')
            .where('item.isDisabled = false')
            .andWhere('schedule.isActive = true');
        if (groupName) {
            qb.andWhere('UPPER(TRIM(group.name)) = :groupName', {
                groupName: this.normalizeGroupName(groupName),
            });
        }
        if (excludeUploadIds.length > 0) {
            qb.andWhere('(schedule.uploadId IS NULL OR schedule.uploadId NOT IN (:...excludeUploadIds))', { excludeUploadIds });
        }
        if (excludePeriod) {
            qb.andWhere('NOT (schedule.validFrom = :validFrom AND schedule.validTo = :validTo)', excludePeriod);
        }
        return qb.getMany();
    }
    async loadExistingLessons(groupName, excludeUploadIds = [], excludePeriod) {
        const items = await this.loadScheduleItems(excludeUploadIds, groupName, excludePeriod);
        return items.map((item) => (0, schedule_item_mapper_1.mapItemToLessonSlot)(item));
    }
    async loadOtherGroupsLessons(groupName, excludeUploadIds = []) {
        const normalizedGroupName = this.normalizeGroupName(groupName);
        const items = await this.loadScheduleItems(excludeUploadIds);
        return items
            .filter((item) => this.normalizeGroupName(item.schedule.group?.name ?? '') !== normalizedGroupName)
            .map((item) => (0, schedule_item_mapper_1.mapItemToLessonSlot)(item));
    }
    async listUploads() {
        const uploads = await this.uploadsRepository.find({
            relations: ['uploadedBy'],
            order: { uploadedAt: 'DESC' },
        });
        for (const upload of uploads) {
            if (upload.parseStatus !== schedule_upload_entity_1.ScheduleParseStatus.SUCCESS) {
                continue;
            }
            const importWarnings = await this.scheduleImportService.refreshUploadReferences(upload.id);
            const mergedWarnings = schedule_import_service_1.ScheduleImportService.mergeStoredWarnings(upload.parseWarnings, importWarnings);
            const nextWarnings = mergedWarnings.length > 0 ? mergedWarnings : null;
            if (JSON.stringify(upload.parseWarnings ?? []) !== JSON.stringify(nextWarnings ?? [])) {
                upload.parseWarnings = nextWarnings;
                await this.uploadsRepository.save(upload);
            }
        }
        return uploads.map((upload) => this.toResponse(upload));
    }
    async uploadSchedule(uploadedById, scheduleTypeRaw, expectedGroupNameRaw, facultyNameRaw, file) {
        this.assertValidUpload(file);
        const originalFileName = decodeUploadedFilename(file.originalname);
        const scheduleType = this.parseScheduleType(scheduleTypeRaw);
        const expectedGroupName = this.parseRequiredGroupName(expectedGroupNameRaw);
        const facultyName = this.parseFacultyName(facultyNameRaw);
        const extension = (0, node_path_1.extname)(originalFileName).toLowerCase();
        if (extension === '.csv') {
            throw new common_1.BadRequestException('Парсер поддерживает только Excel (.xlsx, .xls). Загрузите файл в формате Excel.');
        }
        const parsed = this.parseUploadedWorkbook(file.buffer);
        this.assertGroupMatches(expectedGroupName, parsed.groupName);
        this.assertPeriodDefined(parsed.periodStart, parsed.periodEnd);
        const obsoleteUploads = await this.findPeriodUploads(uploadedById, parsed.groupName, parsed.periodStart, parsed.periodEnd);
        const obsoleteUploadIds = obsoleteUploads.map((upload) => upload.id);
        const excludePeriod = {
            validFrom: this.toDate(parsed.periodStart),
            validTo: this.toDate(parsed.periodEnd),
        };
        const existingSameGroupLessons = await this.loadExistingLessons(parsed.groupName, obsoleteUploadIds, excludePeriod);
        const otherGroupsLessons = await this.loadOtherGroupsLessons(parsed.groupName, obsoleteUploadIds);
        const conflicts = (0, schedule_conflict_validator_1.validateScheduleConflicts)(parsed.lessons, [...existingSameGroupLessons, ...otherGroupsLessons]);
        if (conflicts.length > 0) {
            throw new common_1.BadRequestException({
                message: 'Загрузка отменена: обнаружены конфликты в расписании',
                errors: conflicts.map((conflict) => conflict.message),
                warnings: parsed.warnings,
                groupName: parsed.groupName,
                periodStart: parsed.periodStart,
                periodEnd: parsed.periodEnd,
                lessonsFound: parsed.lessons.length,
            });
        }
        const storedFileName = normalizeStoredFileName(originalFileName);
        const filePath = (0, node_path_1.join)(this.schedulesDir, storedFileName);
        const fileUrl = `/uploads/schedules/${storedFileName}`;
        await (0, promises_1.writeFile)(filePath, file.buffer);
        await this.removeUploads(obsoleteUploads);
        const upload = this.uploadsRepository.create({
            scheduleType,
            originalFileName,
            storedFileName,
            fileUrl,
            mimeType: file.mimetype || 'application/octet-stream',
            fileSize: file.size,
            groupName: parsed.groupName,
            facultyName,
            parseStatus: schedule_upload_entity_1.ScheduleParseStatus.SUCCESS,
            parseErrors: null,
            parseWarnings: parsed.warnings.length > 0 ? parsed.warnings : null,
            lessonsCount: parsed.lessons.length,
            periodStart: parsed.periodStart,
            periodEnd: parsed.periodEnd,
            uploadedById,
        });
        const savedUpload = await this.uploadsRepository.save(upload);
        const importResult = await this.scheduleImportService.importParsedSchedule(parsed, savedUpload);
        savedUpload.lessonsCount = importResult.itemsCount;
        savedUpload.parseWarnings = importResult.warnings.length > 0
            ? importResult.warnings
            : null;
        await this.uploadsRepository.save(savedUpload);
        const uploadWithUser = await this.uploadsRepository.findOne({
            where: { id: savedUpload.id },
            relations: ['uploadedBy'],
        });
        if (!uploadWithUser) {
            throw new common_1.NotFoundException('Загруженный файл не найден');
        }
        this.scheduleNotifier.notifyScheduleChanged('schedule-uploaded');
        await this.notificationsService.notifyScheduleUploaded({
            groupName: parsed.groupName,
            periodStart: parsed.periodStart,
            periodEnd: parsed.periodEnd,
            lessonsCount: savedUpload.lessonsCount,
            isReplacement: obsoleteUploads.length > 0,
            uploadId: savedUpload.id,
        });
        return this.toResponse(uploadWithUser);
    }
    async deleteUpload(id, uploadedById) {
        const upload = await this.uploadsRepository.findOne({ where: { id } });
        if (!upload) {
            throw new common_1.NotFoundException('Файл не найден');
        }
        if (upload.uploadedById !== uploadedById) {
            throw new common_1.ForbiddenException('Можно удалять только свои загрузки');
        }
        await this.handleOwnedSchedulesBeforeUploadDelete(upload);
        const filePath = (0, node_path_1.join)(this.schedulesDir, upload.storedFileName);
        try {
            await (0, promises_1.unlink)(filePath);
        }
        catch {
        }
        await this.uploadsRepository.delete(id);
    }
};
exports.ScheduleUploadService = ScheduleUploadService;
exports.ScheduleUploadService = ScheduleUploadService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(schedule_upload_entity_1.ScheduleUpload)),
    __param(1, (0, typeorm_1.InjectRepository)(schedule_item_entity_1.ScheduleItem)),
    __param(2, (0, typeorm_1.InjectRepository)(schedule_entity_1.Schedule)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        schedule_import_service_1.ScheduleImportService,
        notifications_service_1.NotificationsService,
        schedule_notifier_service_1.ScheduleNotifierService])
], ScheduleUploadService);
//# sourceMappingURL=schedule-upload.service.js.map