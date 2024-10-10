import { ApAxiosManager, CacheDuration } from '../../axios';
import { AbstractLoggingContext } from '../../blueprint/common';
import { NetworkConfig } from '../../blueprint/common/config/networkConfig';
import { TokenMetadataOracle } from '../../blueprint/common/token/tokenMetadataOracle';
import { MetadataStore } from '../../blueprint/meta';
import { BlockByDateAPIInterface } from '../../blueprint/models/blockbydateAPIInterface';
import { Blueprint } from '../../blueprint/models/blueprintInterface';
import { DefiPriceAPIInterface } from '../../blueprint/models/defiPriceAPIInterface';
import { ExchangePrice } from '../../blueprint/models/exchangePrice';
import { ExternalResponseCacheService } from '../../cache';
import { KafkaManager } from '../../logging';
import AsyncRedis from 'async-redis';
import { AxiosInstance } from 'axios';
import { Logger } from 'log4js';

export declare abstract class BlueprintContext {
  protected blueprintKey: string;
  protected networkId: number | string;
  protected loggingContext: AbstractLoggingContext;
  protected contractReader: any;
  networkConfig: NetworkConfig;
  protected exchangePrice: ExchangePrice;
  protected blockByDateApi: BlockByDateAPIInterface;
  protected defiPriceApi: DefiPriceAPIInterface;
  protected axiosManager: ApAxiosManager;
  protected readonly kafkaManager: KafkaManager;
  protected readonly cache: ExternalResponseCacheService;
  includeChildrenBPs: boolean | null;
  protected walletAddresses: string[];
  protected initialized: boolean;
  protected metadataStore: MetadataStore;
  protected childrenBPs: Blueprint[];
  constructor(
    blueprintKey: string,
    networkId: number | string,
    loggingContext: AbstractLoggingContext,
    metadataStore: MetadataStore,
    defiPriceApi?: DefiPriceAPIInterface,
    blockByDateApi?: BlockByDateAPIInterface,
  );
  setBlockByDateApi(blockByDateApi: BlockByDateAPIInterface): void;
  getBlockByDateApi(): BlockByDateAPIInterface;
  getLogger(): Logger;
  getDefiPriceAPI(): DefiPriceAPIInterface;
  setDefiPriceAPI(defiPriceApi: DefiPriceAPIInterface): void;
  private checkNetworkConfig;
  getNetwork(): number;
  getNetworkConfig(): NetworkConfig;
  getBlueprintKey(): string;
  getChildrenBlueprints(): Blueprint[];
  getWalletAddresses(): string[];
  getExchangePrice(): ExchangePrice;
  generateCacheKey(prefix: string, composedKey: string): string;
  cacheOrPerform(cacheKey: any, ttl: any, onCacheMiss: any): Promise<any>;
  /**
   * Gets the raw cache, bypassing the prefix keys we add for context aware
   */
  getRestClient(): AsyncRedis;
  getGasOracle(): import('../common/gas/gasOracle').GasOracle;
  getTokenMetadataOracle(): TokenMetadataOracle;
  getBlockTimeOracle(): import('../common/blocktime/blockTimeOracle').BlockTimeOracle;
  getAxios(cacheDuration?: CacheDuration): AxiosInstance;
  getAxiosManager(): ApAxiosManager;
  getRequestId(): string;
  getMetadataStore(): MetadataStore;
  initialize(wallets: string[], includeChildrenBlueprints?: boolean): void;
  isInitialized(): boolean;
  private setWalletAddresses;
  private setIncludeChildrenBlueprints;
  private initAxiosManager;
  setChildrenBlueprints(childrenBlueprints: Blueprint[]): void;
  abstract setNetworkConfig(networkId: any): NetworkConfig;
  abstract getComposedBlueprintKey(): string | null;
  abstract getContractReaderByNetwork(network: number | string): any;
  abstract getContractReader(): any;
  abstract getConfigService(): any;
}
