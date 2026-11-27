import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ScheduleItem } from './schedule-item.entity';

export enum LessonTypeCode {
    LECTURE = 'lecture',
    PRACTICE = 'practice',
    LAB = 'lab',
    CREDIT = 'credit',
    KR_DEFENSE = 'kr_defense',
    KP_DEFENSE = 'kp_defense',
    SPECIAL = 'special',
}

@Entity('lesson_types')
export class LessonType {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'enum', enum: LessonTypeCode, unique: true })
    code!: LessonTypeCode;

    @Column()
    name!: string;

    @OneToMany(() => ScheduleItem, (item) => item.lessonType)
    scheduleItems!: ScheduleItem[];
}