"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const platform_socket_io_1 = require("@nestjs/platform-socket.io");
const app_module_1 = require("./app.module");
const network_1 = require("./config/network");
const storage_1 = require("./config/storage");
const bootstrap = async () => {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useWebSocketAdapter(new platform_socket_io_1.IoAdapter(app));
    app.useStaticAssets((0, storage_1.getStorageRoot)(), {
        prefix: '/uploads/',
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
    }));
    app.enableCors({
        origin: (origin, callback) => {
            if ((0, network_1.isAllowedCorsOrigin)(origin)) {
                callback(null, true);
                return;
            }
            callback(new Error('Not allowed by CORS'), false);
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });
    const port = Number(process.env.PORT ?? 3000);
    const host = process.env.HOST ?? '0.0.0.0';
    await app.listen(port, host);
    const localIps = (0, network_1.getLocalIpAddresses)();
    console.log(`🚀 Application is running on: http://localhost:${port}`);
    for (const ip of localIps) {
        console.log(`📱 Available on network: http://${ip}:${port}`);
    }
};
bootstrap().catch(err => {
    console.error('❌ Error during bootstrap:', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map