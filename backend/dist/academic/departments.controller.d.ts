import { DepartmentsService, TeacherDepartmentInfo } from './departments.service';
export declare class DepartmentsController {
    private readonly departmentsService;
    constructor(departmentsService: DepartmentsService);
    listTeacherDepartments(): Promise<TeacherDepartmentInfo[]>;
}
