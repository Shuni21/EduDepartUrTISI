import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
export interface TeacherDepartmentInfo {
    id: number;
    shortName: string;
    name: string;
    label: string;
}
export interface StaffDepartmentInfo {
    id: number;
    name: string;
}
export declare class DepartmentsService {
    private readonly departmentRepository;
    private static readonly STAFF_DEPARTMENT_MARKERS;
    constructor(departmentRepository: Repository<Department>);
    private isStaffDepartment;
    private mapDepartment;
    listStaffDepartments(): Promise<StaffDepartmentInfo[]>;
    resolveStaffDepartmentId(departmentId: number): Promise<Department>;
    resolveDepartmentByInput(raw: string): Promise<Department>;
    private normalizeDepartmentInput;
    listTeacherDepartments(): Promise<TeacherDepartmentInfo[]>;
    resolveTeacherDepartmentId(departmentId: number): Promise<Department>;
    getTeacherDepartmentById(departmentId: number): Promise<TeacherDepartmentInfo>;
    getTeacherDepartmentByShortName(shortName: string): Promise<Department>;
}
