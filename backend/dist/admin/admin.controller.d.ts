import { Request } from 'express';
import { AdminService } from './admin.service';
import { AdminAcademicService } from './admin-academic.service';
import { SetDepartmentHeadDto } from './dto/set-department-head.dto';
import { CreateDirectionDto } from './dto/create-direction.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { CreateTeacherDepartmentDto } from './dto/create-teacher-department.dto';
import { CreateStaffDepartmentDto } from './dto/create-staff-department.dto';
interface AuthenticatedRequest extends Request {
    user: {
        sub: number;
        login: string;
    };
}
export declare class AdminController {
    private readonly adminService;
    private readonly adminAcademicService;
    constructor(adminService: AdminService, adminAcademicService: AdminAcademicService);
    listUsers(): Promise<import("./admin.service").AdminUserResponse[]>;
    createUser(body: Record<string, unknown>, photo?: Express.Multer.File): Promise<import("./admin.service").AdminUserResponse>;
    getUser(id: number): Promise<import("./admin.service").AdminUserResponse>;
    updateUser(id: number, body: Record<string, unknown>, photo: Express.Multer.File | undefined, req: AuthenticatedRequest): Promise<import("./admin.service").AdminUserResponse>;
    deleteUser(id: number, req: AuthenticatedRequest): Promise<{
        success: true;
    }>;
    listSessions(): Promise<import("./admin.service").AdminSessionResponse[]>;
    revokeSession(id: number): Promise<{
        success: true;
    }>;
    getAcademicOverview(): Promise<import("./admin-academic.service").AcademicStructureOverview>;
    createAcademicDirection(dto: CreateDirectionDto): Promise<import("./admin-academic.service").AcademicDirection>;
    createAcademicGroup(directionId: number, dto: CreateGroupDto): Promise<import("./admin-academic.service").AcademicGroup>;
    createTeacherDepartment(dto: CreateTeacherDepartmentDto): Promise<import("./admin-academic.service").AcademicDepartment>;
    createStaffDepartment(dto: CreateStaffDepartmentDto): Promise<import("./admin-academic.service").AcademicDepartment>;
    setDepartmentHead(id: number, dto: SetDepartmentHeadDto): Promise<import("./admin-academic.service").AcademicDepartment>;
    deleteAcademicGroup(id: number): Promise<{
        success: true;
    }>;
    deleteAcademicDirection(id: number): Promise<{
        success: true;
    }>;
    deleteAcademicDepartment(id: number): Promise<{
        success: true;
    }>;
    listStaffDepartments(): Promise<import("../academic/departments.service").StaffDepartmentInfo[]>;
    mergeAcademicDirections(sourceId: number, targetId: number): Promise<{
        success: true;
    }>;
}
export {};
