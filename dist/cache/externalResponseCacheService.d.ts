/**
 * Class that's responsible for getting cached info if exists.
 */
import { ApiCallResults } from './apiCallResults.entity';
import AsyncRedis from 'async-redis';
import { Repository } from 'typeorm';
export declare class ExternalResponseCacheService {
    private cache;
    private apiCallResultsRepo;
    static readonly SUPER_SHORT_CACHE_DURATION: number;
    static readonly SHORT_CACHE_DURATION: number;
    static readonly TEN_MIN_CACHE_DURATION: number;
    static readonly MEDIUM_CACHE_DURATION: number;
    static readonly SIX_HOUR_DURATION: number;
    static readonly LONG_CACHE_DURATION: number;
    static readonly PERM_CACHE_DURATION: number;
    private skipCache;
    constructor(cache: AsyncRedis, apiCallResultsRepo: Repository<ApiCallResults>);
    /**
     * Helper to try and fetch from the cache first based on the key, or perform (and cache) if key doesn't exist
     * @param context
     * @param cacheKey
     * @param ttl
     * @param onCacheMiss
     */
    cacheOrPerform(chainId: string, cacheKey: string, ttl: number, onCacheMiss: any): Promise<any>;
    private maybeCacheResult;
    private saveResultToDb;
    /**
     * Recursively removes Unicode control characters from strings within any data structure.
     * Removes control characters (U+0000 to U+001F) and extended control characters
     *   (U+007F to U+009F), then trims whitespace
     *
     * @param obj - The input value to clean, can be of any type
     * @returns The cleaned version of the input with all Unicode control characters removed
     *
     * @example
     * cleanUnicode("Hello\u0000World") // Returns "HelloWorld"
     * cleanUnicode(["Te\u0001st", { key: "Va\u0002lue" }]) // Returns ["Test", { key: "Value" }]
     */
    private cleanUnicode;
    getRestClient(): AsyncRedis;
    private maybeAddPrefix;
    private replacer;
    private redisCacheReviver;
    private maybeTransformToBN;
    private dbCacheReviver;
}
