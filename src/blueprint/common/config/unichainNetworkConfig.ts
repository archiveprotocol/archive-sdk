import { CHAINID } from '../../../constants';
import { BaseEvmNetworkConfig } from './baseEvmNetworkConfig';

export abstract class UnichainNetworkConfig extends BaseEvmNetworkConfig {
  getInitStartBlock(): number {
    return 1;
  }

  getNetwork(): number {
    return Number(CHAINID.UNICHAIN);
  }

  getNetworkName(): string {
    return 'Unichain';
  }

  isContractNameLookupEnabled(): boolean {
    return false;
  }
}
