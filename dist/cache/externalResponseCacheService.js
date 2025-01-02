"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ExternalResponseCacheService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalResponseCacheService = void 0;
/**
 * Class that's responsible for getting cached info if exists.
 */
const apiCallResults_entity_1 = require("./apiCallResults.entity");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const async_redis_1 = __importDefault(require("async-redis"));
const ethers_1 = require("ethers");
const typeorm_2 = require("typeorm");
let ExternalResponseCacheService = ExternalResponseCacheService_1 = class ExternalResponseCacheService {
    constructor(cache, apiCallResultsRepo) {
        this.cache = cache;
        this.apiCallResultsRepo = apiCallResultsRepo;
        this.skipCache = process.env.NODE_ENV == 'development';
    }
    /**
     * Helper to try and fetch from the cache first based on the key, or perform (and cache) if key doesn't exist
     * @param context
     * @param cacheKey
     * @param ttl
     * @param onCacheMiss
     */
    cacheOrPerform(chainId, cacheKey, ttl, onCacheMiss) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.skipCache) {
                // we want to skip any cache on development so we don't run into caching issues
                return yield onCacheMiss();
            }
            const key = this.maybeAddPrefix(chainId, cacheKey);
            try {
                const cached = yield this.cache.get(key);
                if (cached) {
                    return JSON.parse(cached, this.redisCacheReviver);
                }
                const dbCached = yield this.apiCallResultsRepo.findOneBy({ key });
                if (dbCached) {
                    return this.dbCacheReviver(dbCached);
                }
                // No cached data, so perform the operation and store the result to db if it's a valid response and PERM_CACHE_DURATION.
                const entity = yield onCacheMiss();
                if (entity === 0) {
                    return 0; // 0 can be temporary, so don't cache
                }
                if (!entity) {
                    return null;
                }
                if (entity === '') {
                    return null;
                }
                if (Array.isArray(entity) && entity.length == 0) {
                    return [];
                }
                if (entity instanceof Map && entity.size == 0) {
                    return null;
                }
                yield this.maybeCacheResult(ttl, chainId, key, entity);
                return entity;
            }
            catch (e) {
                console.error(e.message);
                throw e;
            }
        });
    }
    maybeCacheResult(ttl, chainId, key, entity) {
        return __awaiter(this, void 0, void 0, function* () {
            if (ttl == ExternalResponseCacheService_1.PERM_CACHE_DURATION) {
                yield this.saveResultToDb(chainId, key, entity);
            }
            else if (ttl > 0) {
                yield this.cache.set(key, JSON.stringify(entity, this.replacer), 'EX', ttl);
            }
        });
    }
    saveResultToDb(chainId, key, entity) {
        return __awaiter(this, void 0, void 0, function* () {
            const callResultsRepo = new apiCallResults_entity_1.ApiCallResults();
            callResultsRepo.chainId = Number(chainId);
            callResultsRepo.key = key;
            callResultsRepo.value = this.cleanUnicode(entity);
            yield this.apiCallResultsRepo.upsert(callResultsRepo, ['key']);
        });
    }
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
    cleanUnicode(obj) {
        if (obj === null || obj === undefined) {
            return obj;
        }
        if (typeof obj === 'string') {
            return obj
                .split('')
                // Filter out unwanted control characters
                .filter((char) => {
                const code = char.charCodeAt(0); // Get the Unicode code of the character
                // Remove characters that are control characters (<= 0x1f)
                // or extended control characters (between 0x7f and 0x9f)
                return !(code <= 0x1f || (code >= 0x7f && code <= 0x9f));
            })
                .join('')
                .trim(); // Remove any leading or trailing spaces from the string
        }
        // Handle arrays
        if (Array.isArray(obj)) {
            return obj.map((item) => this.cleanUnicode(item));
        }
        // Handle objects
        if (typeof obj === 'object') {
            const cleaned = {};
            for (const [key, value] of Object.entries(obj)) {
                cleaned[key] = this.cleanUnicode(value);
            }
            return cleaned;
        }
        // Return other types as-is (numbers, booleans, etc.)
        return obj;
    }
    getRestClient() {
        return this.cache;
    }
    maybeAddPrefix(chainId, key) {
        // for non eth mainnet, add in a prefix
        if (chainId != '1') {
            const env = process.env.NODE_ENV === 'production' ? '' : process.env.NODE_ENV;
            return `NETWORK_${env}::${chainId}:${key}`;
        }
        return key;
    }
    replacer(key, value) {
        if (value instanceof Map) {
            return {
                dataType: 'Map',
                value: Array.from(value.entries()), // or with spread: value: [...value]
            };
        }
        else if (this[key] instanceof ethers_1.ethers.BigNumber || typeof this[key] === 'bigint') {
            return { dataType: 'ethers.BigNumber', value: this[key].toString() };
        }
        else {
            return value;
        }
    }
    redisCacheReviver(key, value) {
        if (typeof value === 'object' && value !== null) {
            if (value.dataType === 'Map') {
                return new Map(value.value);
            }
            else if (value.dataType === 'ethers.BigNumber') {
                return ethers_1.ethers.BigNumber.from(value.value);
            }
        }
        return value;
    }
    maybeTransformToBN(value) {
        if (value['type'] === 'BigNumber') {
            return ethers_1.ethers.BigNumber.from(value['hex']);
        }
        return value;
    }
    dbCacheReviver(dbCached) {
        if (Array.isArray(dbCached.value)) {
            return dbCached.value.map((e) => this.maybeTransformToBN(e));
        }
        return this.maybeTransformToBN(dbCached.value);
    }
};
exports.ExternalResponseCacheService = ExternalResponseCacheService;
ExternalResponseCacheService.SUPER_SHORT_CACHE_DURATION = process.env.NODE_ENV == 'production' ? 60 : 10;
ExternalResponseCacheService.SHORT_CACHE_DURATION = process.env.NODE_ENV == 'production' ? 60 * 3 : 10;
ExternalResponseCacheService.TEN_MIN_CACHE_DURATION = process.env.NODE_ENV == 'production' ? 60 * 10 : 10;
ExternalResponseCacheService.MEDIUM_CACHE_DURATION = process.env.NODE_ENV == 'production' ? 60 * 30 : 10;
ExternalResponseCacheService.SIX_HOUR_DURATION = process.env.NODE_ENV == 'production' ? 60 * 60 * 6 : 10;
ExternalResponseCacheService.LONG_CACHE_DURATION = process.env.NODE_ENV == 'production' ? 60 * 60 * 48 : 10;
ExternalResponseCacheService.PERM_CACHE_DURATION = process.env.NODE_ENV == 'production' ? 60 * 60 * 24 * 999 : 20;
exports.ExternalResponseCacheService = ExternalResponseCacheService = ExternalResponseCacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('CACHE_ETH')),
    __param(1, (0, typeorm_1.InjectRepository)(apiCallResults_entity_1.ApiCallResults)),
    __metadata("design:paramtypes", [typeof (_a = typeof async_redis_1.default !== "undefined" && async_redis_1.default) === "function" ? _a : Object, typeorm_2.Repository])
], ExternalResponseCacheService);
//# sourceMappingURL=externalResponseCacheService.js.map