import { CHAINID } from '../../constants';
import { KafkaManager } from '../../logging';
import { RpcInfo } from '../../web3-wrapper/rpc/rpcInfo';
import { ArchiveLogger, REQUEST_ID } from '../logger';
import { AbstractRPCSender } from './abstractRPCSender';
import { RPCOracle } from './rpcOracle';
import { asL2Provider } from '@eth-optimism/sdk';
import { ethers } from 'ethers';
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
    private rpcProviderFn: (provider: ethers.providers.StaticJsonRpcProvider) => Promise<any>,
    private requestId?: string,
    private attemptFallback = true,
  ) {
    super();
    this.rpcOracle = new RPCOracle(networkId, rpcInfos);

    this.maxAttempts = this.attemptFallback ? this.rpcOracle.getRpcCount() : 1;

    this.logger = ArchiveLogger.getLogger();
    if (this.requestId) this.logger.addContext(REQUEST_ID, this.requestId);
  }

  public async executeWithFallbacks(): Promise<any> {
    for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
      const selectedRpcUrl = this.rpcOracle.getNextAvailableRpc();
      if (!selectedRpcUrl) {
        continue;
      }
      const kafkaManager = KafkaManager.getInstance();
      try {
        const start = performance.now();
        const result = await this.rpcProviderFn(
          this.isOptimismOrBaseNetwork(String(this.networkId))
            ? asL2Provider(
                new ethers.providers.StaticJsonRpcProvider({
                  url: selectedRpcUrl,
                  timeout: this.timeoutMilliseconds,
                }),
              )
            : new ethers.providers.StaticJsonRpcProvider({
                url: selectedRpcUrl,
                timeout: this.timeoutMilliseconds,
              }),
        );
        const end = performance.now();
        const kafkaManager = KafkaManager.getInstance();
        kafkaManager?.sendRpcResponseTimeToKafka(selectedRpcUrl, end - start, this.requestId);

        return result;
      } catch (error) {
        const errorMessage = this.getErrorMessage(error, selectedRpcUrl);
        this.logger.error(errorMessage);
        kafkaManager?.sendRpcFailureToKafka(
          selectedRpcUrl,
          String(this.networkId),
          this.rpcProviderFn,
          error.message,
          this.requestId,
        );
        if (!this.shouldRetry(error)) break;
      }
    }

    const errorMessage = `All RPCs failed for networkId: ${
      this.networkId
    }, function called: ${this.rpcProviderFn.toString()}`;
    this.logger.error(errorMessage);
    return null;
  }

  private isOptimismOrBaseNetwork(networkId: string): boolean {
    return networkId === CHAINID.OPTIMISM || networkId === CHAINID.BASE;
  }
}
