import { RpcInfo } from '../web3-wrapper/rpc/rpcInfo';
import { EvmRPCSender } from './rpc/evmRPCSender';
import { SolanaRPCSender } from './rpc/solanaRPCSender';
import * as web3_solana from '@solana/web3.js';
import { ethers } from 'ethers';

export async function executeCallOrSend(
  rpcInfos: RpcInfo[],
  networkId: number | string,
  rpcProviderFn: (provider: ethers.providers.StaticJsonRpcProvider) => Promise<any>,
  requestId?: string,
  attemptFallback = true,
): Promise<any> {
  const sender = new EvmRPCSender(rpcInfos, networkId, rpcProviderFn, requestId, attemptFallback);
  return sender.executeWithFallbacks();
}

export async function executeCallOrSendSolana(
  rpcInfos: RpcInfo[],
  networkId: number | string,
  rpcProviderFn: (conn: web3_solana.Connection) => Promise<any>,
  requestId?: string,
  attemptFallback = true,
): Promise<any> {
  const sender = new SolanaRPCSender(rpcInfos, networkId, rpcProviderFn, requestId, attemptFallback);
  return sender.executeWithFallbacks();
}
