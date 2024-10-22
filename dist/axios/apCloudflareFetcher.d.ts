import { AxiosInstance } from 'axios';
/**
 * This fetcher will first use a random proxy server, then will call the Cloudflare function with this random IP.
 * Cloudflare will then use the closest server to this IP and make the request.
 */
export declare class ApCloudflareFetcher {
    private readonly maxRetries;
    private readonly retryStatusCodes;
    private configureProxy;
    fetch(axios: AxiosInstance, url: string, headers?: {}): Promise<any>;
    private isRetryable;
}
