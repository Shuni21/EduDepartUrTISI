import { Request } from 'express';
import { UsersService } from '../users/users.service';
import { ConsultationService, DepartmentConsultationsResponse, DepartmentInfo } from './consultation.service';
import { CreateConsultationDto, UpdateConsultationDto } from './dto/consultation.dto';
import { ScheduleDisplayLesson } from './schedule-display.service';
export declare class ConsultationController {
    private readonly consultationService;
    private readonly usersService;
    constructor(consultationService: ConsultationService, usersService: UsersService);
    listDepartments(): Promise<DepartmentInfo[]>;
    getDepartmentConsultations(departmentId: number): Promise<DepartmentConsultationsResponse>;
    createConsultation(request: Request & {
        user?: {
            sub?: number;
        };
    }, dto: CreateConsultationDto): Promise<ScheduleDisplayLesson>;
    updateConsultation(request: Request & {
        user?: {
            sub?: number;
        };
    }, id: number, dto: UpdateConsultationDto): Promise<ScheduleDisplayLesson>;
    deleteConsultation(request: Request & {
        user?: {
            sub?: number;
        };
    }, id: number): Promise<void>;
}
