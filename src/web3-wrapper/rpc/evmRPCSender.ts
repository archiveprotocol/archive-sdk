import { CHAINID } from '../../constants';
import { KafkaManager, Queues } from '../../logging';
import { RpcInfo } from '../../web3-wrapper/rpc/rpcInfo';
import { ArchiveLogger, REQUEST_ID } from '../logger';
import { ArchiveJsonRpcProvider } from '../networkConfigurations';
import { AbstractRPCSender } from './abstractRPCSender';
import { RPCOracle } from './rpcOracle';
import { asL2Provider } from '@eth-optimism/sdk';
import { ethers } from 'ethers';
import { FetchRequest, JsonRpcProvider, Network } from 'ethers-v6';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { Logger } from 'log4js';
import { performance } from 'perf_hooks';

export class EvmRPCSender extends AbstractRPCSender {
  private logger: Logger;
  private timeoutMilliseconds = 10000;
  private providerCacheV5: Map<string, ethers.providers.StaticJsonRpcProvider> = new Map();
  private providerCacheV6: Map<string, JsonRpcProvider> = new Map();

  constructor(
    private networkId: number | string,
    private networkName: string,

    private proxyServerUrl: string,
    private requestId: string,
    private sessionId?: string,
  ) {
    super();
    this.logger = ArchiveLogger.getLogger();
    if (this.requestId) this.logger.addContext(REQUEST_ID, this.requestId);
  }

  /**
   * @deprecated Use executeCallOrSendV5 or executeCallOrSendV6 instead.
   */
  public async executeCallOrSend(
    rpcInfos: RpcInfo[],
    rpcProviderFn?: (provider: ArchiveJsonRpcProvider) => Promise<any>,
    attemptFallback = true,
    logRpcFailure = false,
    throwException = false,
    logMetadata?: any,
  ): Promise<any> {
    console.warn(
      '[EvmRPCSender] executeCallOrSend is deprecated. Use executeCallOrSendV5 (ethers v5) or executeCallOrSendV6 (ethers v6) instead.',
    );
    return this.executeCallOrSendV5(rpcInfos, rpcProviderFn, attemptFallback, logRpcFailure, throwException, logMetadata);
  }

  public async executeCallOrSendV5(
    rpcInfos: RpcInfo[],
    rpcProviderFn?: (provider: ethers.providers.StaticJsonRpcProvider) => Promise<any>,
    attemptFallback = true,
    logRpcFailure = false,
    throwException = false,
    logMetadata?: any,
  ): Promise<any> {
    const rpcOracle = new RPCOracle(this.networkId, rpcInfos);
    const maxAttempts = attemptFallback ? rpcOracle.getRpcCount() : 1;

    if (!rpcProviderFn) {
      throw new Error('RPC Provider function is not defined');
    }
    const kafkaManager = KafkaManager.getInstance();

    let lastSelectedRpc = rpcOracle.getNextAvailableRpc();

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const selectedRpc = attempt === 0 ? lastSelectedRpc : rpcOracle.getNextAvailableRpc();
      lastSelectedRpc = selectedRpc;

      if (!selectedRpc) {
        continue;
      }

      try {
        if (attempt > 0) {
          this.logger.info(
            `Retrying the RPC call with, ${selectedRpc.url}, attempt: ${attempt} out of: ${maxAttempts}`,
          );
        }
        const start = performance.now();
        const result = await rpcProviderFn(this.getProviderForCallV5(selectedRpc));
        const end = performance.now();
        kafkaManager?.sendRpcResponseTimeToKafka(
          selectedRpc.url,
          end - start,
          this.requestId,
          Queues.RESPONSE_TIMES,
          this.sessionId,
        );

        return result;
      } catch (error) {
        if (logRpcFailure) {
          const errorMessage = this.getErrorMessage(error, selectedRpc.url);
          this.logger.error(errorMessage);
          kafkaManager?.sendRpcFailureToKafka(
            selectedRpc.url,
            String(this.networkId),
            rpcProviderFn,
            error,
            this.requestId,
            this.sessionId,
          );
        }
        if (!this.shouldRetry(error)) break;
      }
    }

    let errorMessage = '';

    if (logRpcFailure || throwException) {
      errorMessage = `All RPCs failed for networkId: ${this.networkId}, rpc called ${
        lastSelectedRpc?.url
      }, metadata: ${JSON.stringify(logMetadata)}`;
      this.logger.error(errorMessage);
    }

    if (throwException) {
      throw new Error(errorMessage);
    } else {
      return null;
    }
  }

  public async executeCallOrSendV6(
    rpcInfos: RpcInfo[],
    rpcProviderFn?: (provider: JsonRpcProvider) => Promise<any>,
    attemptFallback = true,
    logRpcFailure = false,
    throwException = false,
    logMetadata?: any,
  ): Promise<any> {
    const rpcOracle = new RPCOracle(this.networkId, rpcInfos);
    const maxAttempts = attemptFallback ? rpcOracle.getRpcCount() : 1;

    if (!rpcProviderFn) {
      throw new Error('RPC Provider function is not defined');
    }
    const kafkaManager = KafkaManager.getInstance();

    let lastSelectedRpc = rpcOracle.getNextAvailableRpc();

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const selectedRpc = attempt === 0 ? lastSelectedRpc : rpcOracle.getNextAvailableRpc();
      lastSelectedRpc = selectedRpc;

      if (!selectedRpc) {
        continue;
      }

      try {
        if (attempt > 0) {
          this.logger.info(
            `Retrying the RPC call with, ${selectedRpc.url}, attempt: ${attempt} out of: ${maxAttempts}`,
          );
        }
        const start = performance.now();
        const result = await rpcProviderFn(this.getProviderForCallV6(selectedRpc));
        const end = performance.now();
        kafkaManager?.sendRpcResponseTimeToKafka(
          selectedRpc.url,
          end - start,
          this.requestId,
          Queues.RESPONSE_TIMES,
          this.sessionId,
        );

        return result;
      } catch (error) {
        if (logRpcFailure) {
          const errorMessage = this.getErrorMessage(error, selectedRpc.url);
          this.logger.error(errorMessage);
          kafkaManager?.sendRpcFailureToKafka(
            selectedRpc.url,
            String(this.networkId),
            rpcProviderFn,
            error,
            this.requestId,
            this.sessionId,
          );
        }
        if (!this.shouldRetry(error)) break;
      }
    }

    let errorMessage = '';

    if (logRpcFailure || throwException) {
      errorMessage = `All RPCs failed for networkId: ${this.networkId}, rpc called ${
        lastSelectedRpc?.url
      }, metadata: ${JSON.stringify(logMetadata)}`;
      this.logger.error(errorMessage);
    }

    if (throwException) {
      throw new Error(errorMessage);
    } else {
      return null;
    }
  }

  private isOptimismOrBaseNetwork(networkId: string): boolean {
    return networkId === CHAINID.OPTIMISM || networkId === CHAINID.BASE;
  }

  /**
   * @deprecated Use getProviderForCallV5 or getProviderForCallV6 instead.
   */
  public getProviderForCall(selectedRpc: RpcInfo): ArchiveJsonRpcProvider {
    return this.getProviderForCallV5(selectedRpc);
  }

  public getProviderForCallV5(selectedRpc: RpcInfo): ethers.providers.StaticJsonRpcProvider {
    const cacheKey = this.generateCacheKey(selectedRpc);

    const cached = this.providerCacheV5.get(cacheKey);
    if (cached) return cached;

    let provider: ethers.providers.StaticJsonRpcProvider;

    if (this.isOptimismOrBaseNetwork(String(this.networkId))) {
      provider = asL2Provider(
        new ethers.providers.StaticJsonRpcProvider({
          url: selectedRpc.url,
          timeout: this.timeoutMilliseconds,
        }),
      );
    } else if (selectedRpc.requiresProxy && this.proxyServerUrl) {
      // Proxy support for v5: fall back to a basic StaticJsonRpcProvider without proxy
      // (proxy is only supported in the v6 path via FetchRequest)
      provider = new ethers.providers.StaticJsonRpcProvider({
        url: selectedRpc.url,
        timeout: this.timeoutMilliseconds,
      });
    } else {
      provider = new ethers.providers.StaticJsonRpcProvider({
        url: selectedRpc.url,
        timeout: this.timeoutMilliseconds,
      });
    }

    this.providerCacheV5.set(cacheKey, provider);
    return provider;
  }

  public getProviderForCallV6(selectedRpc: RpcInfo): JsonRpcProvider {
    const cacheKey = this.generateCacheKey(selectedRpc);

    const cached = this.providerCacheV6.get(cacheKey);
    if (cached) return cached;

    let provider: JsonRpcProvider;

    if (selectedRpc.requiresProxy && this.proxyServerUrl) {
      provider = this.getProxyRPCProvider(selectedRpc.url);
    } else {
      const fetchReq = new FetchRequest(selectedRpc.url);
      fetchReq.timeout = this.timeoutMilliseconds;
      const staticNetwork = new Network(this.networkName, BigInt(this.networkId));
      provider = new JsonRpcProvider(fetchReq, Number(this.networkId), { staticNetwork });
    }

    this.providerCacheV6.set(cacheKey, provider);
    return provider;
  }

  private generateCacheKey(rpcInfo: RpcInfo): string {
    const networkIdStr = String(this.networkId);
    const proxyStr = rpcInfo.requiresProxy ? `proxy:${this.proxyServerUrl}` : 'no-proxy';
    return `${networkIdStr}:${rpcInfo.url}:${proxyStr}`;
  }

  private getProxyRPCProvider(rpcUrl: string): JsonRpcProvider {
    const fetchReq = new FetchRequest(rpcUrl);
    fetchReq.timeout = this.timeoutMilliseconds;
    const staticNetwork = new Network(this.networkName, BigInt(this.networkId));
    fetchReq.getUrlFunc = FetchRequest.createGetUrlFunc({ agent: new HttpsProxyAgent(this.proxyServerUrl) });
    return new JsonRpcProvider(fetchReq, Number(this.networkId), { staticNetwork });
  }
}
