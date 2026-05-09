"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractRPCSender = void 0;
class AbstractRPCSender {
    getErrorMessage(error, rpcUrl) {
        if (error.code === 'NETWORK_ERROR') {
            return `Error connecting to RPC ${rpcUrl}, message: ${error.message}`;
        }
        else {
            return `Error on RPC ${rpcUrl}, code: ${error.code}, message: ${error.message}`;
        }
    }
    shouldRetry(error) {
        var _a;
        const retryErrorCodes = ['NETWORK_ERROR', 'TIMEOUT'];
        return (retryErrorCodes.includes(error.code) ||
            retryErrorCodes.includes((_a = error.error) === null || _a === void 0 ? void 0 : _a.code) ||
            [402, 403, 429].includes(error.status));
    }
}
exports.AbstractRPCSender = AbstractRPCSender;
//# sourceMappingURL=abstractRPCSender.js.map