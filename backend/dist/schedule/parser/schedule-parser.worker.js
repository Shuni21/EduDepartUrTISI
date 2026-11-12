"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const excel_grid_parser_1 = require("./excel-grid.parser");
try {
    const buffer = Buffer.from(worker_threads_1.workerData.buffer);
    const result = (0, excel_grid_parser_1.parseScheduleWorkbook)(buffer);
    worker_threads_1.parentPort?.postMessage({
        ok: true,
        result,
    });
}
catch (error) {
    worker_threads_1.parentPort?.postMessage({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
    });
}
//# sourceMappingURL=schedule-parser.worker.js.map