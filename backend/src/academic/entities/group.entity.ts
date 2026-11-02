import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Subgroup } from './subgroup.entity';
import { StudentProfile } from '../../users/entities/student-profile.entity';
import { Schedule } from '../../schedule/entities/schedule.entity';

export enum EducationForm {
    FULL_TIME = 'full_time',
    PART_TIME = 'part_time',
    DISTANCE = 'distance',
}

@Entity('groups')
export class Group {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ type: 'smallint' })
    course!: number;

    @Column({ type: 'enum', enum: EducationForm })
    educationForm!: EducationForm;

    @OneToMany(() => Subgroup, (subgroup) => subgroup.group)
    subgroups!: Subgroup[];

    @OneToMany(() => StudentProfile, (profile) => profile.group)
    studentProfiles!: StudentProfile[];

    @OneToMany(() => Schedule, (schedule) => schedule.group)
    schedules!: Schedule[];
}