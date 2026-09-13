"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLocalNetworkOrigin = isLocalNetworkOrigin;
exports.isAllowedCorsOrigin = isAllowedCorsOrigin;
exports.getLocalIpAddresses = getLocalIpAddresses;
const node_os_1 = require("node:os");
function parseOriginHostname(origin) {
    try {
        return new URL(origin).hostname;
    }
    catch {
        return null;
    }
}
function getExtraAllowedOrigins() {
    const raw = process.env.CORS_EXTRA_ORIGINS?.trim();
    if (!raw) {
        return [];
    }
    return raw
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}
function isLocalNetworkOrigin(origin) {
    if (!origin) {
        return true;
    }
    const hostname = parseOriginHostname(origin);
    if (!hostname) {
        return false;
    }
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return true;
    }
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
        return true;
    }
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
        return true;
    }
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
        return true;
    }
    return false;
}
function isAllowedCorsOrigin(origin) {
    if (!origin) {
        return true;
    }
    if (isLocalNetworkOrigin(origin)) {
        return true;
    }
    return getExtraAllowedOrigins().includes(origin);
}
function getLocalIpAddresses() {
    const interfaces = (0, node_os_1.networkInterfaces)();
    const addresses = new Set();
    for (const entries of Object.values(interfaces)) {
        for (const entry of entries ?? []) {
            if (entry.family === 'IPv4' && !entry.internal) {
                addresses.add(entry.address);
            }
        }
    }
    return [...addresses];
}
//# sourceMappingURL=network.js.map