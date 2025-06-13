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
  private providerCache: Map<string, ArchiveJsonRpcProvider> = new Map();

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

  public async executeCallOrSend(
    rpcInfos: RpcInfo[],
    rpcProviderFn?: (provider: ArchiveJsonRpcProvider) => Promise<any>,
    attemptFallback = true,
    logRpcFailure = false,
    throwException = false,
    logMetadata?: any,
  ): Promise<any> {
    const rpcOracle = new RPCOracle(this.networkId, rpcInfos);
    const selectedRpc = rpcOracle.getNextAvailableRpc();
    const maxAttempts = attemptFallback ? rpcOracle.getRpcCount() : 1;

    if (!rpcProviderFn) {
      throw new Error('RPC Provider function is not defined');
    }
    const kafkaManager = KafkaManager.getInstance();

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
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
        const result = await rpcProviderFn(this.getProviderForCall(selectedRpc));
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
        selectedRpc.url
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

  public getProviderForCall(selectedRpc: RpcInfo): ArchiveJsonRpcProvider {
    // Generate a cache key that includes relevant properties
    const cacheKey = this.generateCacheKey(selectedRpc);

    // Check if we already have a provider for this RPC URL in the cache
    const cachedProvider = this.providerCache.get(cacheKey);
    if (cachedProvider) {
      return cachedProvider;
    }

    // Create a new provider if not in cache
    let provider: ArchiveJsonRpcProvider;

    if (this.isOptimismOrBaseNetwork(String(this.networkId))) {
      provider = asL2Provider(
        new ethers.providers.StaticJsonRpcProvider({
          url: selectedRpc.url,
          timeout: this.timeoutMilliseconds,
        }),
      );
    } else if (selectedRpc.requiresProxy && this.proxyServerUrl) {
      provider = this.getProxyRPCProvider(selectedRpc.url);
    } else {
      provider = new ethers.providers.StaticJsonRpcProvider({
        url: selectedRpc.url,
        timeout: this.timeoutMilliseconds,
      });
    }

    // Store the provider in the cache
    this.providerCache.set(cacheKey, provider);

    return provider;
  }

  private generateCacheKey(rpcInfo: RpcInfo): string {
    // Create a unique key based on URL and whether proxy is required
    const networkIdStr = String(this.networkId);
    const proxyStr = rpcInfo.requiresProxy ? `proxy:${this.proxyServerUrl}` : 'no-proxy';
    return `${networkIdStr}:${rpcInfo.url}:${proxyStr}`;
  }

  private getProxyRPCProvider(rpcUrl: string): JsonRpcProvider {
    const fetchReq = new FetchRequest(rpcUrl);
    const staticNetwork = new Network(this.networkName, BigInt(this.networkId));
    fetchReq.getUrlFunc = FetchRequest.createGetUrlFunc({ agent: new HttpsProxyAgent(this.proxyServerUrl) });
    return new JsonRpcProvider(fetchReq, Number(this.networkId), { staticNetwork });
  }
}
