"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddKpDefenseLessonType1795791485533 = void 0;
class AddKpDefenseLessonType1795791485533 {
    name = 'AddKpDefenseLessonType1795791485533';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TYPE "public"."lesson_types_code_enum" RENAME TO "lesson_types_code_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."lesson_types_code_enum" AS ENUM('lecture', 'practice', 'lab', 'credit', 'kr_defense', 'kp_defense', 'special')`);
        await queryRunner.query(`ALTER TABLE "lesson_types" ALTER COLUMN "code" TYPE "public"."lesson_types_code_enum" USING "code"::"text"::"public"."lesson_types_code_enum"`);
        await queryRunner.query(`DROP TYPE "public"."lesson_types_code_enum_old"`);
        await queryRunner.query(`INSERT INTO "lesson_types" ("code", "name") SELECT 'kp_defense', 'Защита КП' WHERE NOT EXISTS (SELECT 1 FROM "lesson_types" WHERE "code" = 'kp_defense')`);
    }
    async down(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."lesson_types_code_enum_old" AS ENUM('lecture', 'practice', 'lab', 'credit', 'kr_defense', 'special')`);
        await queryRunner.query(`ALTER TABLE "lesson_types" ALTER COLUMN "code" TYPE "public"."lesson_types_code_enum_old" USING "code"::"text"::"public"."lesson_types_code_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."lesson_types_code_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."lesson_types_code_enum_old" RENAME TO "lesson_types_code_enum"`);
    }
}
exports.AddKpDefenseLessonType1795791485533 = AddKpDefenseLessonType1795791485533;
//# sourceMappingURL=1795791485533-AddKpDefenseLessonType.js.map