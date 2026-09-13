"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMigrationsDir = getMigrationsDir;
exports.buildDatabaseConnectionOptions = buildDatabaseConnectionOptions;
exports.buildCliDataSourceOptions = buildCliDataSourceOptions;
const node_path_1 = require("node:path");
function readDatabaseEnv(env) {
    const host = env.DB_HOST;
    const port = env.DB_PORT;
    const username = env.DB_USERNAME;
    const password = env.DB_PASSWORD;
    const database = env.DB_DATABASE;
    if (!host || !port || !username || !password || !database) {
        throw new Error('Database env vars are required: DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE');
    }
    return {
        host,
        port: parseInt(port, 10),
        username,
        password,
        database,
    };
}
function getMigrationsDir() {
    return (0, node_path_1.join)(__dirname, 'migrations');
}
function buildDatabaseConnectionOptions(env) {
    return {
        type: 'postgres',
        ...readDatabaseEnv(env),
        migrations: [(0, node_path_1.join)(__dirname, 'migrations', '*.{js}')],
        migrationsRun: true,
        synchronize: false,
    };
}
function buildCliDataSourceOptions(env) {
    return {
        type: 'postgres',
        ...readDatabaseEnv(env),
        entities: [(0, node_path_1.join)(__dirname, '../**/*.entity.{ts,js}')],
        migrations: [(0, node_path_1.join)(getMigrationsDir(), '*.{ts,js}')],
        synchronize: false,
    };
}
//# sourceMappingURL=typeorm.config.js.map