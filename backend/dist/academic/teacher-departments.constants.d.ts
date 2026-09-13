export interface TeacherDepartmentDefinition {
    shortName: string;
    name: string;
}
export declare const TEACHER_DEPARTMENTS: TeacherDepartmentDefinition[];
export declare function formatTeacherDepartmentLabel(department: Pick<TeacherDepartmentDefinition, 'shortName' | 'name'>): string;
