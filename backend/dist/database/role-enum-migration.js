"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateRoleEnumBeforeSync = migrateRoleEnumBeforeSync;
const pg_1 = require("pg");
function getPgClientOptions(options) {
    if (options.type !== 'postgres') {
        throw new Error('Role enum migration supports only PostgreSQL');
    }
    return {
        host: options.host,
        port: options.port,
        user: options.username,
        password: options.password,
        database: options.database,
    };
}
async function enumLabelExists(client, enumName, label) {
    const result = await client.query(`
            SELECT EXISTS (
                SELECT 1
                FROM pg_enum AS enum_value
                INNER JOIN pg_type AS enum_type
                    ON enum_value.enumtypid = enum_type.oid
                WHERE enum_type.typname = $1
                  AND enum_value.enumlabel = $2
            ) AS exists
        `, [enumName, label]);
    return result.rows[0]?.exists ?? false;
}
async function migrateRoleEnumBeforeSync(options) {
    const client = new pg_1.Client(getPgClientOptions(options));
    await client.connect();
    try {
        const enumCheck = await client.query(`
            SELECT EXISTS (
                SELECT 1
                FROM pg_type
                WHERE typname = 'roles_code_enum'
            ) AS exists
        `);
        if (!enumCheck.rows[0]?.exists) {
            return;
        }
        if (!(await enumLabelExists(client, 'roles_code_enum', 'employee'))) {
            await client.query(`ALTER TYPE roles_code_enum ADD VALUE 'employee'`);
        }
        await client.query(`
            INSERT INTO roles (code, name)
            SELECT 'employee', 'Сотрудник'
            WHERE NOT EXISTS (
                SELECT 1 FROM roles WHERE code::text = 'employee'
            );
        `);
        const legacyRoleIds = await client.query(`
            SELECT id
            FROM roles
            WHERE code::text = 'education_department'
               OR (name = 'Учебный отдел' AND code::text <> 'employee')
        `);
        const employeeRole = await client.query(`
            SELECT id
            FROM roles
            WHERE code::text = 'employee'
            LIMIT 1
        `);
        const employeeRoleId = employeeRole.rows[0]?.id;
        if (employeeRoleId && legacyRoleIds.rows.length > 0) {
            const legacyIds = legacyRoleIds.rows.map((row) => row.id);
            await client.query(`
                    UPDATE users
                    SET "roleId" = $1
                    WHERE "roleId" = ANY($2::int[])
                `, [employeeRoleId, legacyIds]);
            await client.query(`
                    DELETE FROM roles
                    WHERE id = ANY($1::int[])
                `, [legacyIds]);
        }
    }
    finally {
        await client.end();
    }
}
//# sourceMappingURL=role-enum-migration.js.map