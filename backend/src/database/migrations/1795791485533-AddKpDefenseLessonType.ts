import { MigrationInterface, QueryRunner } from "typeorm";

export class AddKpDefenseLessonType1795791485533 implements MigrationInterface {
    name = 'AddKpDefenseLessonType1795791485533'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."lesson_types_code_enum" RENAME TO "lesson_types_code_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."lesson_types_code_enum" AS ENUM('lecture', 'practice', 'lab', 'credit', 'kr_defense', 'kp_defense', 'special')`);
        await queryRunner.query(`ALTER TABLE "lesson_types" ALTER COLUMN "code" TYPE "public"."lesson_types_code_enum" USING "code"::"text"::"public"."lesson_types_code_enum"`);
        await queryRunner.query(`DROP TYPE "public"."lesson_types_code_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."lesson_types_code_enum_old" AS ENUM('lecture', 'practice', 'lab', 'credit', 'kr_defense', 'special')`);
        await queryRunner.query(`ALTER TABLE "lesson_types" ALTER COLUMN "code" TYPE "public"."lesson_types_code_enum_old" USING "code"::"text"::"public"."lesson_types_code_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."lesson_types_code_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."lesson_types_code_enum_old" RENAME TO "lesson_types_code_enum"`);
    }

}
