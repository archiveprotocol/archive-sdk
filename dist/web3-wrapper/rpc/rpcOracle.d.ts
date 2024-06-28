export declare class RPCOracle {
    private networkId;
    private rpcs;
    private currentIndex;
    constructor(networkId: number | string, rpcUrls: string[]);
    getRpcCount(): number;
    shuffleRpcUrls(rpcUrls: string[]): string[];
    getNextAvailableRpc(): string;
}
