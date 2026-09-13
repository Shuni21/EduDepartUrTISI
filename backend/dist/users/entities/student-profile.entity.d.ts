import { User } from './user.entity';
import { Group, EducationForm } from '../../academic/entities/group.entity';
import { Subgroup } from '../../academic/entities/subgroup.entity';
export declare class StudentProfile {
    id: number;
    userId: number;
    user: User;
    groupId: number;
    group: Group;
    subgroupId: number | null;
    subgroup: Subgroup | null;
    course: number;
    educationForm: EducationForm;
}
