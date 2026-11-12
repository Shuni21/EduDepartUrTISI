"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleParserWorkerClient = void 0;
const common_1 = require("@nestjs/common");
const worker_threads_1 = require("worker_threads");
const path_1 = require("path");
let ScheduleParserWorkerClient = class ScheduleParserWorkerClient {
    async parse(buffer) {
        return new Promise((resolve, reject) => {
            const workerPath = (0, path_1.join)(__dirname, 'schedule-parser.worker.js');
            const worker = new worker_threads_1.Worker(workerPath, {
                workerData: {
                    buffer: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
                },
            });
            worker.on('message', (message) => {
                if (message.ok) {
                    resolve(message.result);
                }
                else {
                    reject(new Error(message.error || 'Ошибка парсинга в worker'));
                }
            });
            worker.on('error', (err) => {
                reject(err);
            });
            worker.on('exit', (code) => {
                if (code !== 0) {
                    reject(new Error(`Worker завершился с кодом ${code}`));
                }
            });
        });
    }
};
exports.ScheduleParserWorkerClient = ScheduleParserWorkerClient;
exports.ScheduleParserWorkerClient = ScheduleParserWorkerClient = __decorate([
    (0, common_1.Injectable)()
], ScheduleParserWorkerClient);
//# sourceMappingURL=schedule-parser.worker-client.js.map