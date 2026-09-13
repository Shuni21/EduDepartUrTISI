"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrateLegacyRoleEnum1740000000001 = void 0;
class MigrateLegacyRoleEnum1740000000001 {
    name = 'MigrateLegacyRoleEnum1740000000001';
    async up(queryRunner) {
        const enumExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1
                FROM pg_type
                WHERE typname = 'roles_code_enum'
            ) AS exists
        `);
        if (!enumExists[0]?.exists) {
            return;
        }
        const employeeLabelExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1
                FROM pg_enum AS enum_value
                INNER JOIN pg_type AS enum_type
                    ON enum_value.enumtypid = enum_type.oid
                WHERE enum_type.typname = 'roles_code_enum'
                  AND enum_value.enumlabel = 'employee'
            ) AS exists
        `);
        if (!employeeLabelExists[0]?.exists) {
            await queryRunner.query(`ALTER TYPE roles_code_enum ADD VALUE 'employee'`);
        }
        await queryRunner.query(`
            INSERT INTO roles (code, name)
            SELECT 'employee', 'Сотрудник'
            WHERE NOT EXISTS (
                SELECT 1 FROM roles WHERE code::text = 'employee'
            )
        `);
        const legacyRoleIds = await queryRunner.query(`
            SELECT id
            FROM roles
            WHERE code::text = 'education_department'
               OR (name = 'Учебный отдел' AND code::text <> 'employee')
        `);
        const employeeRole = await queryRunner.query(`
            SELECT id
            FROM roles
            WHERE code::text = 'employee'
            LIMIT 1
        `);
        const employeeRoleId = employeeRole[0]?.id;
        if (employeeRoleId && legacyRoleIds.length > 0) {
            const legacyIds = legacyRoleIds.map((row) => row.id);
            await queryRunner.query(`
                    UPDATE users
                    SET "roleId" = $1
                    WHERE "roleId" = ANY($2::int[])
                `, [employeeRoleId, legacyIds]);
            await queryRunner.query(`
                    DELETE FROM roles
                    WHERE id = ANY($1::int[])
                `, [legacyIds]);
        }
    }
    async down(_queryRunner) {
    }
}
exports.MigrateLegacyRoleEnum1740000000001 = MigrateLegacyRoleEnum1740000000001;
//# sourceMappingURL=1740000000001-MigrateLegacyRoleEnum.js.map