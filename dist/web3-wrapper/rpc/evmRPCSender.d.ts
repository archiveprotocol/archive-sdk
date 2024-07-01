import { RpcInfo } from '../../web3-wrapper/rpc/rpcInfo';
import { AbstractRPCSender } from './abstractRPCSender';
import { ethers } from 'ethers';

export declare class EvmRPCSender extends AbstractRPCSender {
  private networkId;
  private rpcProviderFn;
  private requestId?;
  private attemptFallback;
  private rpcOracle;
  private maxAttempts;
  private logger;
  private timeoutMilliseconds;
  constructor(
    rpcInfos: RpcInfo[],
    networkId: number | string,
    rpcProviderFn: (provider: ethers.providers.StaticJsonRpcProvider) => Promise<any>,
    requestId?: string,
    attemptFallback?: boolean,
  );
  executeWithFallbacks(): Promise<any>;
  private isOptimismOrBaseNetwork;
}
