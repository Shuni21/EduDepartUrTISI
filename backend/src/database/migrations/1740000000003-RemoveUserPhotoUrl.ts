import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveUserPhotoUrl1740000000003 implements MigrationInterface {
    name = 'RemoveUserPhotoUrl1740000000003';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN IF EXISTS "photoUrl"`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "photoUrl" character varying`,
        );
    }
}
