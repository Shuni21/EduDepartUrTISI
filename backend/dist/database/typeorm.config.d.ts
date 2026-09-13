import { DataSourceOptions } from 'typeorm';
export declare function getMigrationsDir(): string;
export declare function buildDatabaseConnectionOptions(env: NodeJS.ProcessEnv): DataSourceOptions;
export declare function buildCliDataSourceOptions(env: NodeJS.ProcessEnv): DataSourceOptions;
