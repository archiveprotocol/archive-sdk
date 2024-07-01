import { RpcInfo } from '../web3-wrapper/rpc/rpcInfo';
import * as web3_solana from '@solana/web3.js';
import { ethers } from 'ethers';

export declare function executeCallOrSend(
  rpcInfos: RpcInfo[],
  networkId: number | string,
  rpcProviderFn: (provider: ethers.providers.StaticJsonRpcProvider) => Promise<any>,
  requestId?: string,
  attemptFallback?: boolean,
): Promise<any>;
export declare function executeCallOrSendSolana(
  rpcInfos: RpcInfo[],
  networkId: number | string,
  rpcProviderFn: (conn: web3_solana.Connection) => Promise<any>,
  requestId?: string,
  attemptFallback?: boolean,
): Promise<any>;
