import { CHAINID } from '../../constants';
import { KafkaManager } from '../../logging';
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
  private rpcOracle: RPCOracle;
  private maxAttempts: number;
  private logger: Logger;
  private timeoutMilliseconds = 10000;

  constructor(
    rpcInfos: RpcInfo[],
    private networkId: number | string,
    private networkName: string,
    private rpcProviderFn?: (provider: ArchiveJsonRpcProvider) => Promise<any>,
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
      this.logger.info('Executing re-try', attempt);
      const selectedRpc = this.rpcOracle.getNextAvailableRpc();
      if (!selectedRpc) {
        continue;
      }
      const kafkaManager = KafkaManager.getInstance();
      try {
        const start = performance.now();
        const result = await this.rpcProviderFn(this.getProviderForCall(selectedRpc));
        const end = performance.now();
        const kafkaManager = KafkaManager.getInstance();
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
        this.logger.error('Retrying the RPC call');
        if (!this.shouldRetry(error)) break;
      }
    }

    const errorMessage = `All RPCs failed for networkId: ${this.networkId
      }, function called: ${this.rpcProviderFn.toString()}`;
    this.logger.error(errorMessage);
    this.logger.info('here?');
    return null;
  }

  private isOptimismOrBaseNetwork(networkId: string): boolean {
    return networkId === CHAINID.OPTIMISM || networkId === CHAINID.BASE;
  }

  public getProviderForCall(selectedRpc?: RpcInfo): ArchiveJsonRpcProvider {
    if (!selectedRpc) {
      selectedRpc = this.rpcOracle.getNextAvailableRpc();
    }

    if (this.isOptimismOrBaseNetwork(String(this.networkId))) {
      return asL2Provider(
        new ethers.providers.StaticJsonRpcProvider({
          url: selectedRpc.url,
          timeout: this.timeoutMilliseconds,
        }),
      );
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
