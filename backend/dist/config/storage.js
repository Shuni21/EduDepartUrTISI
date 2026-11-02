"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSchedulesDir = getSchedulesDir;
const node_path_1 = require("node:path");
function getSchedulesDir() {
    return (0, node_path_1.join)(__dirname, '..', '..', 'storage', 'schedules');
}
//# sourceMappingURL=storage.js.map