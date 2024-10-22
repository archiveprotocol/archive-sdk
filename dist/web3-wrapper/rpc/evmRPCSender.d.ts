import { RpcInfo } from '../../web3-wrapper/rpc/rpcInfo';
import { ArchiveJsonRpcProvider } from '../networkConfigurations';
import { AbstractRPCSender } from './abstractRPCSender';
export type Provider = ArchiveJsonRpcProvider | any;
export declare class EvmRPCSender extends AbstractRPCSender {
    private networkId;
    private networkName;
    private rpcProviderFn?;
    private proxyServerUrl?;
    private requestId?;
    private attemptFallback;
    private rpcOracle;
    private maxAttempts;
    private logger;
    private timeoutMilliseconds;
    constructor(rpcInfos: RpcInfo[], networkId: number | string, networkName: string, rpcProviderFn?: (provider: Provider) => Promise<any>, proxyServerUrl?: string, requestId?: string, attemptFallback?: boolean);
    executeCallOrSend(): Promise<any>;
    private isOptimismOrBaseNetwork;
    private getViemChain;
    getProviderForCall(selectedRpc?: RpcInfo): Promise<Provider>;
    private getProxyRPCProvider;
}
