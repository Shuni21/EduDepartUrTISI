"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const dotenv_1 = require("dotenv");
const typeorm_1 = require("typeorm");
const typeorm_config_1 = require("./typeorm.config");
const backendRoot = (0, node_path_1.join)(__dirname, '..', '..');
for (const envFile of ['.env']) {
    const envPath = (0, node_path_1.join)(backendRoot, envFile);
    if ((0, node_fs_1.existsSync)(envPath)) {
        (0, dotenv_1.config)({ path: envPath });
        break;
    }
}
exports.default = new typeorm_1.DataSource((0, typeorm_config_1.buildCliDataSourceOptions)(process.env));
//# sourceMappingURL=data-source.js.map