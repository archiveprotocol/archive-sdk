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
    constructor(networkId, networkName, proxyServerUrl, requestId, sessionId) {
        super();
        this.networkId = networkId;
        this.networkName = networkName;
        this.proxyServerUrl = proxyServerUrl;
        this.requestId = requestId;
        this.sessionId = sessionId;
        this.timeoutMilliseconds = 10000;
        this.providerCacheV5 = new Map();
        this.providerCacheV6 = new Map();
        this.logger = logger_1.ArchiveLogger.getLogger();
        if (this.requestId)
            this.logger.addContext(logger_1.REQUEST_ID, this.requestId);
    }
    /**
     * @deprecated Use executeCallOrSendV5 or executeCallOrSendV6 instead.
     */
    executeCallOrSend(rpcInfos, rpcProviderFn, attemptFallback = true, logRpcFailure = false, throwException = false, logMetadata) {
        return __awaiter(this, void 0, void 0, function* () {
            console.warn('[EvmRPCSender] executeCallOrSend is deprecated. Use executeCallOrSendV5 (ethers v5) or executeCallOrSendV6 (ethers v6) instead.');
            return this.executeCallOrSendV5(rpcInfos, rpcProviderFn, attemptFallback, logRpcFailure, throwException, logMetadata);
        });
    }
    executeCallOrSendV5(rpcInfos, rpcProviderFn, attemptFallback = true, logRpcFailure = false, throwException = false, logMetadata) {
        return __awaiter(this, void 0, void 0, function* () {
            const rpcOracle = new rpcOracle_1.RPCOracle(this.networkId, rpcInfos);
            const maxAttempts = attemptFallback ? rpcOracle.getRpcCount() : 1;
            if (!rpcProviderFn) {
                throw new Error('RPC Provider function is not defined');
            }
            const kafkaManager = logging_1.KafkaManager.getInstance();
            let lastSelectedRpc = rpcOracle.getNextAvailableRpc();
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                const selectedRpc = attempt === 0 ? lastSelectedRpc : rpcOracle.getNextAvailableRpc();
                lastSelectedRpc = selectedRpc;
                if (!selectedRpc) {
                    continue;
                }
                try {
                    if (attempt > 0) {
                        this.logger.info(`Retrying the RPC call with, ${selectedRpc.url}, attempt: ${attempt} out of: ${maxAttempts}`);
                    }
                    const start = perf_hooks_1.performance.now();
                    const result = yield rpcProviderFn(this.getProviderForCallV5(selectedRpc));
                    const end = perf_hooks_1.performance.now();
                    kafkaManager === null || kafkaManager === void 0 ? void 0 : kafkaManager.sendRpcResponseTimeToKafka(selectedRpc.url, end - start, this.requestId, logging_1.Queues.RESPONSE_TIMES, this.sessionId);
                    return result;
                }
                catch (error) {
                    if (logRpcFailure) {
                        const errorMessage = this.getErrorMessage(error, selectedRpc.url);
                        this.logger.error(errorMessage);
                        kafkaManager === null || kafkaManager === void 0 ? void 0 : kafkaManager.sendRpcFailureToKafka(selectedRpc.url, String(this.networkId), rpcProviderFn, error, this.requestId, this.sessionId);
                    }
                    if (!this.shouldRetry(error))
                        break;
                }
            }
            let errorMessage = '';
            if (logRpcFailure || throwException) {
                errorMessage = `All RPCs failed for networkId: ${this.networkId}, rpc called ${lastSelectedRpc === null || lastSelectedRpc === void 0 ? void 0 : lastSelectedRpc.url}, metadata: ${JSON.stringify(logMetadata)}`;
                this.logger.error(errorMessage);
            }
            if (throwException) {
                throw new Error(errorMessage);
            }
            else {
                return null;
            }
        });
    }
    executeCallOrSendV6(rpcInfos, rpcProviderFn, attemptFallback = true, logRpcFailure = false, throwException = false, logMetadata) {
        return __awaiter(this, void 0, void 0, function* () {
            const rpcOracle = new rpcOracle_1.RPCOracle(this.networkId, rpcInfos);
            const maxAttempts = attemptFallback ? rpcOracle.getRpcCount() : 1;
            if (!rpcProviderFn) {
                throw new Error('RPC Provider function is not defined');
            }
            const kafkaManager = logging_1.KafkaManager.getInstance();
            let lastSelectedRpc = rpcOracle.getNextAvailableRpc();
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                const selectedRpc = attempt === 0 ? lastSelectedRpc : rpcOracle.getNextAvailableRpc();
                lastSelectedRpc = selectedRpc;
                if (!selectedRpc) {
                    continue;
                }
                try {
                    if (attempt > 0) {
                        this.logger.info(`Retrying the RPC call with, ${selectedRpc.url}, attempt: ${attempt} out of: ${maxAttempts}`);
                    }
                    const start = perf_hooks_1.performance.now();
                    const result = yield rpcProviderFn(this.getProviderForCallV6(selectedRpc));
                    const end = perf_hooks_1.performance.now();
                    kafkaManager === null || kafkaManager === void 0 ? void 0 : kafkaManager.sendRpcResponseTimeToKafka(selectedRpc.url, end - start, this.requestId, logging_1.Queues.RESPONSE_TIMES, this.sessionId);
                    return result;
                }
                catch (error) {
                    if (logRpcFailure) {
                        const errorMessage = this.getErrorMessage(error, selectedRpc.url);
                        this.logger.error(errorMessage);
                        kafkaManager === null || kafkaManager === void 0 ? void 0 : kafkaManager.sendRpcFailureToKafka(selectedRpc.url, String(this.networkId), rpcProviderFn, error, this.requestId, this.sessionId);
                    }
                    if (!this.shouldRetry(error))
                        break;
                }
            }
            let errorMessage = '';
            if (logRpcFailure || throwException) {
                errorMessage = `All RPCs failed for networkId: ${this.networkId}, rpc called ${lastSelectedRpc === null || lastSelectedRpc === void 0 ? void 0 : lastSelectedRpc.url}, metadata: ${JSON.stringify(logMetadata)}`;
                this.logger.error(errorMessage);
            }
            if (throwException) {
                throw new Error(errorMessage);
            }
            else {
                return null;
            }
        });
    }
    isOptimismOrBaseNetwork(networkId) {
        return networkId === constants_1.CHAINID.OPTIMISM || networkId === constants_1.CHAINID.BASE;
    }
    /**
     * @deprecated Use getProviderForCallV5 or getProviderForCallV6 instead.
     */
    getProviderForCall(selectedRpc) {
        return this.getProviderForCallV5(selectedRpc);
    }
    getProviderForCallV5(selectedRpc) {
        const cacheKey = this.generateCacheKey(selectedRpc);
        const cached = this.providerCacheV5.get(cacheKey);
        if (cached)
            return cached;
        let provider;
        if (this.isOptimismOrBaseNetwork(String(this.networkId))) {
            provider = (0, sdk_1.asL2Provider)(new ethers_1.ethers.providers.StaticJsonRpcProvider({
                url: selectedRpc.url,
                timeout: this.timeoutMilliseconds,
            }));
        }
        else if (selectedRpc.requiresProxy && this.proxyServerUrl) {
            // Proxy support for v5: fall back to a basic StaticJsonRpcProvider without proxy
            // (proxy is only supported in the v6 path via FetchRequest)
            provider = new ethers_1.ethers.providers.StaticJsonRpcProvider({
                url: selectedRpc.url,
                timeout: this.timeoutMilliseconds,
            });
        }
        else {
            provider = new ethers_1.ethers.providers.StaticJsonRpcProvider({
                url: selectedRpc.url,
                timeout: this.timeoutMilliseconds,
            });
        }
        this.providerCacheV5.set(cacheKey, provider);
        return provider;
    }
    getProviderForCallV6(selectedRpc) {
        const cacheKey = this.generateCacheKey(selectedRpc);
        const cached = this.providerCacheV6.get(cacheKey);
        if (cached)
            return cached;
        let provider;
        if (selectedRpc.requiresProxy && this.proxyServerUrl) {
            provider = this.getProxyRPCProvider(selectedRpc.url);
        }
        else {
            const fetchReq = new ethers_v6_1.FetchRequest(selectedRpc.url);
            fetchReq.timeout = this.timeoutMilliseconds;
            const staticNetwork = new ethers_v6_1.Network(this.networkName, BigInt(this.networkId));
            provider = new ethers_v6_1.JsonRpcProvider(fetchReq, Number(this.networkId), { staticNetwork });
        }
        this.providerCacheV6.set(cacheKey, provider);
        return provider;
    }
    generateCacheKey(rpcInfo) {
        const networkIdStr = String(this.networkId);
        const proxyStr = rpcInfo.requiresProxy ? `proxy:${this.proxyServerUrl}` : 'no-proxy';
        return `${networkIdStr}:${rpcInfo.url}:${proxyStr}`;
    }
    getProxyRPCProvider(rpcUrl) {
        const fetchReq = new ethers_v6_1.FetchRequest(rpcUrl);
        fetchReq.timeout = this.timeoutMilliseconds;
        const staticNetwork = new ethers_v6_1.Network(this.networkName, BigInt(this.networkId));
        fetchReq.getUrlFunc = ethers_v6_1.FetchRequest.createGetUrlFunc({ agent: new https_proxy_agent_1.HttpsProxyAgent(this.proxyServerUrl) });
        return new ethers_v6_1.JsonRpcProvider(fetchReq, Number(this.networkId), { staticNetwork });
    }
}
exports.EvmRPCSender = EvmRPCSender;
//# sourceMappingURL=evmRPCSender.js.map