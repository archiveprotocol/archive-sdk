import { CHAINID } from '../../constants';
import { KafkaManager } from '../../logging';
import { RpcInfo } from '../../web3-wrapper/rpc/rpcInfo';
import { ArchiveLogger, REQUEST_ID } from '../logger';
import { ArchiveJsonRpcProvider } from '../networkConfigurations';
import { AbstractRPCSender } from './abstractRPCSender';
import { RPCOracle } from './rpcOracle';
import { createPublicClient, http, PublicClient, Client, Transport, Chain } from 'viem';
import { base, optimism } from 'viem/chains';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { Logger } from 'log4js';
import { performance } from 'perf_hooks';
import { ethers } from 'ethers';
import { FetchRequest, JsonRpcProvider, Network } from 'ethers-v6';

// Define a type for the provider that includes both possible types
export type Provider = ArchiveJsonRpcProvider | Client<Transport, Chain>;

export class EvmRPCSender extends AbstractRPCSender {
  private rpcOracle: RPCOracle;
  private maxAttempts: number;
  private logger: Logger;
  private timeoutMilliseconds = 10000;

  constructor(
    rpcInfos: RpcInfo[],
    private networkId: number | string,
    private networkName: string,
    private rpcProviderFn?: (provider: Provider) => Promise<any>,
    private proxyServerUrl?: string,
    private requestId?: string,
    private attemptFallback = true,
  ) {
    super();
    this.rpcOracle = new RPCOracle(networkId, rpcInfos);
    this.maxAttempts = this.attemptFallback ? this.rpcOracle.getRpcCount() : 1;
    this.logger = ArchiveLogger.getLogger();
    if (this.requestId) this.logger.addContext(REQUEST_ID, this.requestId);
  }

  public async executeCallOrSend(): Promise<any> {
    if (!this.rpcProviderFn) {
      throw new Error('RPC Provider function is not defined');
    }

    for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
      const selectedRpc = this.rpcOracle.getNextAvailableRpc();
      if (!selectedRpc) {
        continue;
      }
      const kafkaManager = KafkaManager.getInstance();
      try {
        if (attempt > 0) {
          this.logger.info(`Retrying the RPC call with, ${selectedRpc.url}, attempt: ${attempt} out of: ${this.maxAttempts}`);
        }
        const start = performance.now();
        const provider = this.getProviderForCall(selectedRpc);
        const result = await this.rpcProviderFn(provider);
        const end = performance.now();
        kafkaManager?.sendRpcResponseTimeToKafka(selectedRpc.url, end - start, this.requestId);

        return result;
      } catch (error) {
        const errorMessage = this.getErrorMessage(error, selectedRpc.url);
        this.logger.error(errorMessage);
        kafkaManager?.sendRpcFailureToKafka(
          selectedRpc.url,
          String(this.networkId),
          this.rpcProviderFn,
          error.message,
          this.requestId,
        );
        if (!this.shouldRetry(error)) break;
      }
    }

    const errorMessage = `All RPCs failed for networkId: ${this.networkId
      }, function called: ${this.rpcProviderFn.toString()}`;
    this.logger.error(errorMessage);
    return null;
  }

  private isOptimismOrBaseNetwork(networkId: string): boolean {
    return networkId === CHAINID.OPTIMISM || networkId === CHAINID.BASE;
  }

  private getViemChain(networkId: string): Chain {
    switch (networkId) {
      case CHAINID.OPTIMISM:
        return optimism;
      case CHAINID.BASE:
        return base;
      default:
        throw new Error(`Unsupported OP Stack chain: ${networkId}`);
    }
  }

  public getProviderForCall(selectedRpc?: RpcInfo): Provider {
    if (!selectedRpc) {
      selectedRpc = this.rpcOracle.getNextAvailableRpc();
    }

    if (this.isOptimismOrBaseNetwork(String(this.networkId))) {
      const transport = http(selectedRpc.url, {
        timeout: this.timeoutMilliseconds,
      });

      return createPublicClient({
        chain: this.getViemChain(String(this.networkId)),
        transport,
      }) as Client<Transport, Chain>;
    }

    if (selectedRpc.requiresProxy && this.proxyServerUrl) {
      return this.getProxyRPCProvider(selectedRpc.url);
    }

    return new ethers.providers.StaticJsonRpcProvider({
      url: selectedRpc.url,
      timeout: this.timeoutMilliseconds,
    });
  }

  private getProxyRPCProvider(rpcUrl: string): JsonRpcProvider {
    const fetchReq = new FetchRequest(rpcUrl);
    const staticNetwork = new Network(this.networkName, BigInt(this.networkId));
    fetchReq.getUrlFunc = FetchRequest.createGetUrlFunc({ agent: new HttpsProxyAgent(this.proxyServerUrl) });
    return new JsonRpcProvider(fetchReq, Number(this.networkId), { staticNetwork });
  }
}