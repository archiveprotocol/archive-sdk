import { BaseEvmNetworkConfig } from './baseEvmNetworkConfig';
export declare abstract class UnichainNetworkConfig extends BaseEvmNetworkConfig {
    getInitStartBlock(): number;
    getNetwork(): number;
    getNetworkName(): string;
    isContractNameLookupEnabled(): boolean;
}
