import { Repository } from 'typeorm';
import { DepartmentsService } from '../academic/departments.service';
import { ConsultationNotificationsService } from '../notifications/consultation-notifications.service';
import { User } from '../users/entities/user.entity';
import { CreateConsultationDto, UpdateConsultationDto } from './dto/consultation.dto';
import { Consultation } from './entities/consultation.entity';
import { TeacherResolver } from './resolver/teacher.resolver';
import { ScheduleDisplayLesson } from './schedule-display.service';
export interface DepartmentInfo {
    id: number;
    shortName: string;
    name: string;
    label: string;
}
export interface DepartmentConsultationsResponse {
    departmentId: number;
    departmentName: string;
    departmentLabel: string;
    weeks: Record<string, ScheduleDisplayLesson[]>;
}
export declare class ConsultationService {
    private readonly consultationsRepository;
    private readonly usersRepository;
    private readonly departmentsService;
    private readonly teacherResolver;
    private readonly consultationNotificationsService;
    constructor(consultationsRepository: Repository<Consultation>, usersRepository: Repository<User>, departmentsService: DepartmentsService, teacherResolver: TeacherResolver, consultationNotificationsService: ConsultationNotificationsService);
    formatTeacherName(user: User): string;
    private parseWeekStart;
    private formatWeekLabel;
    private formatTime;
    private mapConsultation;
    listDepartments(): Promise<DepartmentInfo[]>;
    getDepartmentConsultations(departmentId: number): Promise<DepartmentConsultationsResponse>;
    private resolveUserDepartmentId;
    private assertUserInDepartment;
    private resolveDepartmentTeacher;
    createConsultation(user: User, dto: CreateConsultationDto): Promise<ScheduleDisplayLesson>;
    updateConsultation(user: User, id: number, dto: UpdateConsultationDto): Promise<ScheduleDisplayLesson>;
    deleteConsultation(user: User, id: number): Promise<void>;
}
