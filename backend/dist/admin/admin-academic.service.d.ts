import { Repository } from 'typeorm';
import { Department } from '../academic/entities/department.entity';
import { Direction } from '../academic/entities/direction.entity';
import { EducationForm, Group } from '../academic/entities/group.entity';
import { Subgroup } from '../academic/entities/subgroup.entity';
import { CreateDirectionDto } from './dto/create-direction.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { CreateTeacherDepartmentDto } from './dto/create-teacher-department.dto';
import { CreateStaffDepartmentDto } from './dto/create-staff-department.dto';
import { StudentProfile } from '../users/entities/student-profile.entity';
import { Schedule } from '../schedule/entities/schedule.entity';
import { User } from '../users/entities/user.entity';
import { TeacherProfile } from '../users/entities/teacher-profile.entity';
import { StaffProfile } from '../users/entities/staff-profile.entity';
import { RoleCode } from '../users/entities/role.entity';
export type AcademicMember = {
    id: number;
    login: string;
    fullName: string;
    role: RoleCode;
    position: string;
    cabinet: string | null;
    isActive: boolean;
};
export type AcademicDepartment = {
    id: number;
    name: string;
    shortName: string | null;
    type: 'teacher' | 'staff';
    headUserId: number | null;
    headFullName: string | null;
    members: AcademicMember[];
};
export type AcademicGroup = {
    id: number;
    name: string;
    educationForm: EducationForm;
    directionId: number;
    directionName: string;
    students: AcademicMember[];
};
export type AcademicDirection = {
    id: number;
    code: string;
    name: string;
    groups: AcademicGroup[];
};
export type AcademicStructureOverview = {
    teacherDepartments: AcademicDepartment[];
    staffDepartments: AcademicDepartment[];
    directions: AcademicDirection[];
};
export declare class AdminAcademicService {
    private readonly departmentRepository;
    private readonly directionRepository;
    private readonly groupRepository;
    private readonly subgroupRepository;
    private readonly studentProfileRepository;
    private readonly scheduleRepository;
    private readonly usersRepository;
    private readonly teacherProfileRepository;
    private readonly staffProfileRepository;
    private static readonly STAFF_DEPARTMENT_MARKERS;
    private static readonly IMPORT_DIRECTION_CODE;
    constructor(departmentRepository: Repository<Department>, directionRepository: Repository<Direction>, groupRepository: Repository<Group>, subgroupRepository: Repository<Subgroup>, studentProfileRepository: Repository<StudentProfile>, scheduleRepository: Repository<Schedule>, usersRepository: Repository<User>, teacherProfileRepository: Repository<TeacherProfile>, staffProfileRepository: Repository<StaffProfile>);
    getOverview(): Promise<AcademicStructureOverview>;
    setDepartmentHead(departmentId: number, headUserId: number | null): Promise<AcademicDepartment>;
    createTeacherDepartment(dto: CreateTeacherDepartmentDto): Promise<AcademicDepartment>;
    createStaffDepartment(dto: CreateStaffDepartmentDto): Promise<AcademicDepartment>;
    createDirection(dto: CreateDirectionDto): Promise<AcademicDirection>;
    createGroup(directionId: number, dto: CreateGroupDto): Promise<AcademicGroup>;
    deleteGroup(groupId: number): Promise<{
        success: true;
    }>;
    deleteDirection(directionId: number): Promise<{
        success: true;
    }>;
    deleteDepartment(departmentId: number): Promise<{
        success: true;
    }>;
    mergeDirections(sourceDirectionId: number, targetDirectionId: number): Promise<{
        success: true;
    }>;
    private isTeacherDepartment;
    private mapDepartment;
    private mapTeacherMember;
    private mapStaffMember;
    private mapStudentMember;
    private mapDirection;
    private formatFullName;
}
