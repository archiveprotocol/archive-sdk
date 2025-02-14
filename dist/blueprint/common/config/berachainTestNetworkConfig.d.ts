import { BaseEvmNetworkConfig } from './baseEvmNetworkConfig';
export declare abstract class BerachainTestNetworkConfig extends BaseEvmNetworkConfig {
    getInitStartBlock(): number;
    getNetwork(): number;
    getNetworkName(): string;
    isContractNameLookupEnabled(): boolean;
}
