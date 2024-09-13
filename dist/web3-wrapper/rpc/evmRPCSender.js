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
exports.EvmRPCSender = void 0;
const constants_1 = require("../../constants");
const logging_1 = require("../../logging");
const logger_1 = require("../logger");
const abstractRPCSender_1 = require("./abstractRPCSender");
const rpcOracle_1 = require("./rpcOracle");
const sdk_1 = require("@eth-optimism/sdk");
const ethers_1 = require("ethers");
const ethers_v6_1 = require("ethers-v6");
const https_proxy_agent_1 = require("https-proxy-agent");
const perf_hooks_1 = require("perf_hooks");
class EvmRPCSender extends abstractRPCSender_1.AbstractRPCSender {
    constructor(rpcInfos, networkId, networkName, rpcProviderFn, proxyServerUrl, requestId, attemptFallback = true) {
        super();
        this.networkId = networkId;
        this.networkName = networkName;
        this.rpcProviderFn = rpcProviderFn;
        this.proxyServerUrl = proxyServerUrl;
        this.requestId = requestId;
        this.attemptFallback = attemptFallback;
        this.timeoutMilliseconds = 10000;
        this.rpcOracle = new rpcOracle_1.RPCOracle(networkId, rpcInfos);
        this.maxAttempts = this.attemptFallback ? this.rpcOracle.getRpcCount() : 1;
        this.logger = logger_1.ArchiveLogger.getLogger();
        if (this.requestId)
            this.logger.addContext(logger_1.REQUEST_ID, this.requestId);
    }
    executeCallOrSend() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.rpcProviderFn) {
                throw new Error('RPC Provider function is not defined');
            }
            for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
                this.logger.info('Executing re-try', attempt);
                const selectedRpc = this.rpcOracle.getNextAvailableRpc();
                if (!selectedRpc) {
                    continue;
                }
                const kafkaManager = logging_1.KafkaManager.getInstance();
                try {
                    const start = perf_hooks_1.performance.now();
                    const result = yield this.rpcProviderFn(this.getProviderForCall(selectedRpc));
                    const end = perf_hooks_1.performance.now();
                    const kafkaManager = logging_1.KafkaManager.getInstance();
                    kafkaManager === null || kafkaManager === void 0 ? void 0 : kafkaManager.sendRpcResponseTimeToKafka(selectedRpc.url, end - start, this.requestId);
                    return result;
                }
                catch (error) {
                    const errorMessage = this.getErrorMessage(error, selectedRpc.url);
                    this.logger.error(errorMessage);
                    kafkaManager === null || kafkaManager === void 0 ? void 0 : kafkaManager.sendRpcFailureToKafka(selectedRpc.url, String(this.networkId), this.rpcProviderFn, error.message, this.requestId);
                    this.logger.error('Retrying the RPC call');
                    if (!this.shouldRetry(error))
                        break;
                }
            }
            const errorMessage = `All RPCs failed for networkId: ${this.networkId}, function called: ${this.rpcProviderFn.toString()}`;
            this.logger.error(errorMessage);
            this.logger.info('here?');
            return null;
        });
    }
    isOptimismOrBaseNetwork(networkId) {
        return networkId === constants_1.CHAINID.OPTIMISM || networkId === constants_1.CHAINID.BASE;
    }
    getProviderForCall(selectedRpc) {
        if (!selectedRpc) {
            selectedRpc = this.rpcOracle.getNextAvailableRpc();
        }
        if (this.isOptimismOrBaseNetwork(String(this.networkId))) {
            return (0, sdk_1.asL2Provider)(new ethers_1.ethers.providers.StaticJsonRpcProvider({
                url: selectedRpc.url,
                timeout: this.timeoutMilliseconds,
            }));
        }
        if (selectedRpc.requiresProxy && this.proxyServerUrl) {
            return this.getProxyRPCProvider(selectedRpc.url);
        }
        return new ethers_1.ethers.providers.StaticJsonRpcProvider({
            url: selectedRpc.url,
            timeout: this.timeoutMilliseconds,
        });
    }
    getProxyRPCProvider(rpcUrl) {
        const fetchReq = new ethers_v6_1.FetchRequest(rpcUrl);
        const staticNetwork = new ethers_v6_1.Network(this.networkName, BigInt(this.networkId));
        fetchReq.getUrlFunc = ethers_v6_1.FetchRequest.createGetUrlFunc({ agent: new https_proxy_agent_1.HttpsProxyAgent(this.proxyServerUrl) });
        return new ethers_v6_1.JsonRpcProvider(fetchReq, Number(this.networkId), { staticNetwork });
    }
}
exports.EvmRPCSender = EvmRPCSender;
//# sourceMappingURL=evmRPCSender.js.map