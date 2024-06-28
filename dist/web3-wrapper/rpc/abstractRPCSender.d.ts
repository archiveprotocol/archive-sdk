export declare class AbstractRPCSender {
    protected getErrorMessage(error: any, rpcUrl: string): string;
    protected shouldRetry(error: any): boolean;
}
