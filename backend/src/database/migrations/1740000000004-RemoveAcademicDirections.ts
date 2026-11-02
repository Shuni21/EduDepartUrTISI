import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveAcademicDirections1740000000004 implements MigrationInterface {
    name = 'RemoveAcademicDirections1740000000004';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "groups" DROP CONSTRAINT IF EXISTS "FK_5bdd0eab540bb13c33c07a764ff"`,
        );
        await queryRunner.query(
            `ALTER TABLE "groups" DROP COLUMN IF EXISTS "directionId"`,
        );
        await queryRunner.query(`DROP TABLE IF EXISTS "directions"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "directions" ("id" SERIAL NOT NULL, "code" character varying NOT NULL, "name" character varying NOT NULL, CONSTRAINT "UQ_0670062704473c1e1f529330c88" UNIQUE ("code"), CONSTRAINT "PK_f619ca47644a835bd091e8b9814" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `INSERT INTO "directions" ("code", "name") VALUES ('RESTORED', 'Восстановленное направление') ON CONFLICT ("code") DO NOTHING`,
        );
        await queryRunner.query(
            `ALTER TABLE "groups" ADD COLUMN IF NOT EXISTS "directionId" integer`,
        );
        await queryRunner.query(`
            UPDATE "groups"
            SET "directionId" = (
                SELECT "id" FROM "directions" WHERE "code" = 'RESTORED'
            )
            WHERE "directionId" IS NULL
        `);
        await queryRunner.query(
            `ALTER TABLE "groups" ALTER COLUMN "directionId" SET NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "groups" ADD CONSTRAINT "FK_5bdd0eab540bb13c33c07a764ff" FOREIGN KEY ("directionId") REFERENCES "directions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }
}
