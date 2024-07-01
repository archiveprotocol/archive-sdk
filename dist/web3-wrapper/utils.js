"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeCallOrSendSolana = exports.executeCallOrSend = void 0;
const evmRPCSender_1 = require("./rpc/evmRPCSender");
const solanaRPCSender_1 = require("./rpc/solanaRPCSender");
function executeCallOrSend(rpcInfos, networkId, rpcProviderFn, requestId, attemptFallback = true) {
    return __awaiter(this, void 0, void 0, function* () {
        const sender = new evmRPCSender_1.EvmRPCSender(rpcInfos, networkId, rpcProviderFn, requestId, attemptFallback);
        return sender.executeWithFallbacks();
    });
}
exports.executeCallOrSend = executeCallOrSend;
function executeCallOrSendSolana(rpcInfos, networkId, rpcProviderFn, requestId, attemptFallback = true) {
    return __awaiter(this, void 0, void 0, function* () {
        const sender = new solanaRPCSender_1.SolanaRPCSender(rpcInfos, networkId, rpcProviderFn, requestId, attemptFallback);
        return sender.executeWithFallbacks();
    });
}
exports.executeCallOrSendSolana = executeCallOrSendSolana;
//# sourceMappingURL=utils.js.map