import {CHAINID} from '../../constants';
import {RPCOracle} from "./rpcOracle";
import {ArchiveLogger, REQUEST_ID} from "../logger";
import {performance} from "perf_hooks";
import {asL2Provider} from "@eth-optimism/sdk";
import {ethers} from "ethers";
import {KafkaManager} from "../../logging";
import {Logger} from 'log4js';
import {AbstractRPCSender} from "./abstractRPCSender";


export class EvmRPCSender extends AbstractRPCSender {

  private rpcOracle: RPCOracle;
  private maxAttempts: number;
  private logger: Logger;

  constructor(
    rpcUrls: string[],
    private networkId: number | string,
    private rpcProviderFn: (provider: ethers.providers.StaticJsonRpcProvider) => Promise<any>,
    private requestId?: string,
    private attemptFallback = true,
  ) {
    super();
    this.rpcOracle = new RPCOracle(networkId, rpcUrls);

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
        const result = await this.rpcProviderFn(
          this.isOptimismOrBaseNetwork(String(this.networkId))
            ? asL2Provider(new ethers.providers.StaticJsonRpcProvider(selectedRpcUrl))
            : new ethers.providers.StaticJsonRpcProvider(selectedRpcUrl),
        );
        const end = performance.now();
        const kafkaManager = KafkaManager.getInstance();
        if (kafkaManager) kafkaManager.sendRpcResponseTimeToKafka(selectedRpcUrl, end - start, this.requestId);

        return result;
      } catch (error) {
        const errorMessage = this.getErrorMessage(error, selectedRpcUrl);
        this.logger.error(errorMessage);
      }
    }

    const errorMessage = `All RPCs failed for networkId: ${this.networkId}, function called: ${this.rpcProviderFn.toString()}`;
    this.logger.error(errorMessage);
    return null;
  }

  private isOptimismOrBaseNetwork(networkId: string): boolean {
    return networkId === CHAINID.OPTIMISM || networkId === CHAINID.BASE;
  }

}
