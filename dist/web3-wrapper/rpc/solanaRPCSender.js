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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolanaRPCSender = void 0;
const logging_1 = require("../../logging");
const logger_1 = require("../logger");
const abstractRPCSender_1 = require("./abstractRPCSender");
const rpcOracle_1 = require("./rpcOracle");
const web3_js_1 = __importDefault(require("@solana/web3.js"));
const perf_hooks_1 = require("perf_hooks");
class SolanaRPCSender extends abstractRPCSender_1.AbstractRPCSender {
    constructor(rpcInfos, networkId, rpcProviderFn, requestId, attemptFallback = true) {
        super();
        this.networkId = networkId;
        this.rpcProviderFn = rpcProviderFn;
        this.requestId = requestId;
        this.attemptFallback = attemptFallback;
        this.rpcOracle = new rpcOracle_1.RPCOracle(networkId, rpcInfos);
        this.maxAttempts = this.attemptFallback ? this.rpcOracle.getRpcCount() : 1;
        this.logger = logger_1.ArchiveLogger.getLogger();
        if (this.requestId)
            this.logger.addContext(logger_1.REQUEST_ID, this.requestId);
    }
    executeWithFallbacks() {
        return __awaiter(this, void 0, void 0, function* () {
            for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
                const selectedRpcUrl = this.rpcOracle.getNextAvailableRpc();
                if (!selectedRpcUrl) {
                    continue;
                }
                try {
                    const start = perf_hooks_1.performance.now();
                    const result = yield this.rpcProviderFn(new web3_js_1.default.Connection(selectedRpcUrl));
                    const end = perf_hooks_1.performance.now();
                    const kafkaManager = logging_1.KafkaManager.getInstance();
                    kafkaManager === null || kafkaManager === void 0 ? void 0 : kafkaManager.sendRpcResponseTimeToKafka(selectedRpcUrl, end - start, this.requestId);
                    return result;
                }
                catch (error) {
                    const errorMessage = this.getErrorMessage(error, selectedRpcUrl);
                    this.logger.error(errorMessage);
                }
            }
            const errorMessage = `All RPCs failed for networkId: ${this.networkId}, function called: ${this.rpcProviderFn.toString()}`;
            this.logger.error(errorMessage);
            return null;
        });
    }
}
exports.SolanaRPCSender = SolanaRPCSender;
//# sourceMappingURL=solanaRPCSender.js.map