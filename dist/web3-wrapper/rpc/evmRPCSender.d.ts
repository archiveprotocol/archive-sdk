import { RpcInfo } from '../../web3-wrapper/rpc/rpcInfo';
import { ArchiveJsonRpcProvider } from '../networkConfigurations';
import { AbstractRPCSender } from './abstractRPCSender';
import { ethers } from 'ethers';
import { JsonRpcProvider } from 'ethers-v6';
export declare class EvmRPCSender extends AbstractRPCSender {
    private networkId;
    private networkName;
    private proxyServerUrl;
    private requestId;
    private sessionId?;
    private logger;
    private timeoutMilliseconds;
    private providerCacheV5;
    private providerCacheV6;
    constructor(networkId: number | string, networkName: string, proxyServerUrl: string, requestId: string, sessionId?: string);
    /**
     * @deprecated Use executeCallOrSendV5 or executeCallOrSendV6 instead.
     */
    executeCallOrSend(rpcInfos: RpcInfo[], rpcProviderFn?: (provider: ArchiveJsonRpcProvider) => Promise<any>, attemptFallback?: boolean, logRpcFailure?: boolean, throwException?: boolean, logMetadata?: any): Promise<any>;
    executeCallOrSendV5(rpcInfos: RpcInfo[], rpcProviderFn?: (provider: ethers.providers.StaticJsonRpcProvider) => Promise<any>, attemptFallback?: boolean, logRpcFailure?: boolean, throwException?: boolean, logMetadata?: any): Promise<any>;
    executeCallOrSendV6(rpcInfos: RpcInfo[], rpcProviderFn?: (provider: JsonRpcProvider) => Promise<any>, attemptFallback?: boolean, logRpcFailure?: boolean, throwException?: boolean, logMetadata?: any): Promise<any>;
    private isOptimismOrBaseNetwork;
    /**
     * @deprecated Use getProviderForCallV5 or getProviderForCallV6 instead.
     */
    getProviderForCall(selectedRpc: RpcInfo): ArchiveJsonRpcProvider;
    getProviderForCallV5(selectedRpc: RpcInfo): ethers.providers.StaticJsonRpcProvider;
    getProviderForCallV6(selectedRpc: RpcInfo): JsonRpcProvider;
    private generateCacheKey;
    private getProxyRPCProvider;
}
