"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const dotenv_1 = require("dotenv");
const pg_1 = require("pg");
const backendRoot = (0, node_path_1.join)(__dirname, '..', '..');
for (const envFile of ['.env']) {
    const envPath = (0, node_path_1.join)(backendRoot, envFile);
    if ((0, node_fs_1.existsSync)(envPath)) {
        (0, dotenv_1.config)({ path: envPath });
        break;
    }
}
const appliedMigrations = [
    { timestamp: 1740000000000, name: 'InitialSchema1740000000000' },
    { timestamp: 1740000000001, name: 'MigrateLegacyRoleEnum1740000000001' },
];
async function main() {
    const client = new pg_1.Client({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT ?? '5432', 10),
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
    });
    await client.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS "migrations" (
                "id" SERIAL NOT NULL,
                "timestamp" bigint NOT NULL,
                "name" character varying NOT NULL,
                CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY ("id")
            )
        `);
        for (const migration of appliedMigrations) {
            const existing = await client.query(`SELECT id FROM migrations WHERE name = $1 LIMIT 1`, [migration.name]);
            if (existing.rows.length > 0) {
                console.log(`Already baselined: ${migration.name}`);
                continue;
            }
            await client.query(`INSERT INTO migrations (timestamp, name) VALUES ($1, $2)`, [migration.timestamp, migration.name]);
            console.log(`Baselined: ${migration.name}`);
        }
    }
    finally {
        await client.end();
    }
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
//# sourceMappingURL=baseline-migrations.js.map