import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Role } from './role.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { StudentProfile } from './student-profile.entity';
import { TeacherProfile } from './teacher-profile.entity';
import { StaffProfile } from './staff-profile.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    login!: string;

    @Column()
    passwordHash!: string;

    @Column()
    roleId!: number;

    @ManyToOne(() => Role, (role) => role.users, { nullable: false })
    @JoinColumn({ name: 'roleId' })
    role!: Role;

    @Column()
    surname!: string;

    @Column()
    name!: string;

    @Column()
    patronymic!: string;

    @Column({ default: true })
    isActive!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @OneToMany(() => RefreshToken, (token) => token.user)
    refreshTokens!: RefreshToken[];

    @OneToOne(() => StudentProfile, (profile) => profile.user)
    studentProfile?: StudentProfile;

    @OneToOne(() => TeacherProfile, (profile) => profile.user)
    teacherProfile?: TeacherProfile;

    @OneToOne(() => StaffProfile, (profile) => profile.user)
    staffProfile?: StaffProfile;
}