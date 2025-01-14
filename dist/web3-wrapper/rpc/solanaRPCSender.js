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
exports.SolanaRPCSender = void 0;
const logging_1 = require("../../logging");
const logger_1 = require("../logger");
const abstractRPCSender_1 = require("./abstractRPCSender");
const rpcOracle_1 = require("./rpcOracle");
const web3_js_1 = require("@solana/web3.js");
const https_proxy_agent_1 = require("https-proxy-agent");
const perf_hooks_1 = require("perf_hooks");
class SolanaRPCSender extends abstractRPCSender_1.AbstractRPCSender {
    constructor(networkId, proxyServerUrl, requestId, sessionId) {
        super();
        this.networkId = networkId;
        this.proxyServerUrl = proxyServerUrl;
        this.requestId = requestId;
        this.sessionId = sessionId;
        this.logger = logger_1.ArchiveLogger.getLogger();
        if (this.requestId)
            this.logger.addContext(logger_1.REQUEST_ID, this.requestId);
    }
    executeCallOrSend(rpcInfos, rpcProviderFn, attemptFallback = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const rpcOracle = new rpcOracle_1.RPCOracle(this.networkId, rpcInfos);
            const maxAttempts = attemptFallback ? rpcOracle.getRpcCount() : 1;
            const kafkaManager = logging_1.KafkaManager.getInstance();
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                const selectedRpc = rpcOracle.getNextAvailableRpc();
                if (!selectedRpc) {
                    continue;
                }
                try {
                    if (attempt > 0) {
                        this.logger.info(`Retrying the RPC call with, ${selectedRpc.url}, attempt: ${attempt} out of: ${maxAttempts}`);
                    }
                    const start = perf_hooks_1.performance.now();
                    const connection = selectedRpc.requiresProxy
                        ? this.getProxyConnection(selectedRpc.url)
                        : new web3_js_1.Connection(selectedRpc.url);
                    const result = yield rpcProviderFn(connection);
                    const end = perf_hooks_1.performance.now();
                    kafkaManager === null || kafkaManager === void 0 ? void 0 : kafkaManager.sendRpcResponseTimeToKafka(selectedRpc.url, end - start, this.requestId, logging_1.Queues.RESPONSE_TIMES, this.sessionId);
                    return result;
                }
                catch (error) {
                    const errorMessage = this.getErrorMessage(error, selectedRpc.url);
                    this.logger.error(errorMessage);
                    kafkaManager === null || kafkaManager === void 0 ? void 0 : kafkaManager.sendRpcFailureToKafka(selectedRpc.url, String(this.networkId), rpcProviderFn, error, this.requestId, this.sessionId);
                }
            }
            const errorMessage = `All RPCs failed for networkId: ${this.networkId}, function called: ${rpcProviderFn.toString()}`;
            this.logger.error(errorMessage);
            return null;
        });
    }
    getProxyConnection(rpcUrl) {
        const agent = new https_proxy_agent_1.HttpsProxyAgent(this.proxyServerUrl);
        return new web3_js_1.Connection(rpcUrl, {
            commitment: 'confirmed',
            fetch: (input, options) => __awaiter(this, void 0, void 0, function* () {
                // docs: https://solana.stackexchange.com/questions/445/how-to-get-solana-web3-js-to-access-the-rpc-endpoints-through-a-proxy
                const processedInput = typeof input === 'string' && input.slice(0, 2) === '//' ? 'https:' + input : input;
                const result = yield fetch(processedInput, Object.assign(Object.assign({}, options), { agent }));
                return result;
            }),
        });
    }
}
exports.SolanaRPCSender = SolanaRPCSender;
//# sourceMappingURL=solanaRPCSender.js.map