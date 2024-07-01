import { KafkaManager } from '../../logging';
import { RpcInfo } from '../../web3-wrapper/rpc/rpcInfo';
import { ArchiveLogger, REQUEST_ID } from '../logger';
import { AbstractRPCSender } from './abstractRPCSender';
import { RPCOracle } from './rpcOracle';
import web3_solana from '@solana/web3.js';
import { Logger } from 'log4js';
import { performance } from 'perf_hooks';

export class SolanaRPCSender extends AbstractRPCSender {
  private rpcOracle: RPCOracle;
  private maxAttempts: number;
  private logger: Logger;

  constructor(
    rpcInfos: RpcInfo[],
    private networkId: number | string,
    private rpcProviderFn: (conn: web3_solana.Connection) => Promise<any>,
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
      try {
        const start = performance.now();
        const result = await this.rpcProviderFn(new web3_solana.Connection(selectedRpcUrl));
        const end = performance.now();
        const kafkaManager = KafkaManager.getInstance();
        kafkaManager?.sendRpcResponseTimeToKafka(selectedRpcUrl, end - start, this.requestId);
        return result;
      } catch (error) {
        const errorMessage = this.getErrorMessage(error, selectedRpcUrl);
        this.logger.error(errorMessage);
      }
    }

    const errorMessage = `All RPCs failed for networkId: ${
      this.networkId
    }, function called: ${this.rpcProviderFn.toString()}`;
    this.logger.error(errorMessage);
    return null;
  }
}
