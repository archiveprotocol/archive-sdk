import { ExternalResponseCacheService } from '../../src/cache/externalResponseCacheService';
import { ApiCallResults } from '../../src/cache/apiCallResults.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import AsyncRedis from 'async-redis';
import { Repository } from 'typeorm';

jest.mock('async-redis');
jest.mock('ethers');

describe('ExternalResponseCacheService', () => {
  let service: ExternalResponseCacheService;
  let cacheMock: jest.Mocked<AsyncRedis>;
  let apiCallResultsRepoMock: jest.Mocked<Repository<ApiCallResults>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExternalResponseCacheService,
        {
          provide: 'CACHE_ETH',
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ApiCallResults),
          useValue: {
            findOneBy: jest.fn(),
            upsert: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ExternalResponseCacheService>(ExternalResponseCacheService);
    cacheMock = module.get('CACHE_ETH');
    apiCallResultsRepoMock = module.get(getRepositoryToken(ApiCallResults));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getRestClient', () => {
    it('should return the cache instance', () => {
      const cacheClient = service.getRestClient();
      expect(cacheClient).toBe(cacheMock);
    });
  });

  describe('cacheOrPerform', () => {
    const mockChainId = '1';
    const mockCacheKey = 'test_key';
    const mockTTL = 60;
    const mockEntity = { data: 'test_data' };
    const mockOnCacheMiss = jest.fn().mockResolvedValue(mockEntity);
    const mockDbEntity = { key: mockCacheKey, value: mockEntity } as ApiCallResults;

    it('should return cached data from Redis if available', async () => {
      cacheMock.get.mockResolvedValueOnce(JSON.stringify(mockEntity));

      const result = await service.cacheOrPerform(mockChainId, mockCacheKey, mockTTL, mockOnCacheMiss);
      expect(result).toEqual(mockEntity);
      expect(cacheMock.get).toHaveBeenCalledWith(mockCacheKey);
      expect(apiCallResultsRepoMock.findOneBy).not.toHaveBeenCalled();
      expect(mockOnCacheMiss).not.toHaveBeenCalled();
    });

    it('should return cached data from the database if Redis cache is empty', async () => {
      cacheMock.get.mockResolvedValueOnce(null);
      apiCallResultsRepoMock.findOneBy.mockResolvedValueOnce(mockDbEntity);

      const result = await service.cacheOrPerform(mockChainId, mockCacheKey, mockTTL, mockOnCacheMiss);
      expect(result).toEqual(mockEntity);
      expect(cacheMock.get).toHaveBeenCalledWith(mockCacheKey);
      expect(apiCallResultsRepoMock.findOneBy).toHaveBeenCalledWith({ key: mockCacheKey });
      expect(mockOnCacheMiss).not.toHaveBeenCalled();
    });

    it('should call onCacheMiss and cache the result if no cache is found', async () => {
      cacheMock.get.mockResolvedValueOnce(null);
      apiCallResultsRepoMock.findOneBy.mockResolvedValueOnce(null);

      const result = await service.cacheOrPerform(mockChainId, mockCacheKey, mockTTL, mockOnCacheMiss);
      expect(result).toEqual(mockEntity);
      expect(mockOnCacheMiss).toHaveBeenCalled();
      expect(cacheMock.set).toHaveBeenCalledWith(mockCacheKey, JSON.stringify(mockEntity), 'EX', mockTTL);
    });

    it('should not cache the result if the entity is 0', async () => {
      mockOnCacheMiss.mockResolvedValueOnce(0);

      const result = await service.cacheOrPerform(mockChainId, mockCacheKey, mockTTL, mockOnCacheMiss);
      expect(result).toEqual(0);
      expect(cacheMock.set).not.toHaveBeenCalled();
    });

    it('should not cache the result if the entity is null or empty', async () => {
      mockOnCacheMiss.mockResolvedValueOnce(null);

      const result = await service.cacheOrPerform(mockChainId, mockCacheKey, mockTTL, mockOnCacheMiss);
      expect(result).toBeNull();
      expect(cacheMock.set).not.toHaveBeenCalled();

      mockOnCacheMiss.mockResolvedValueOnce('');

      const resultEmpty = await service.cacheOrPerform(mockChainId, mockCacheKey, mockTTL, mockOnCacheMiss);
      expect(resultEmpty).toBeNull();
      expect(cacheMock.set).not.toHaveBeenCalled();
    });

    it('should save to the database if the TTL is PERM_CACHE_DURATION', async () => {
      const permTTL = ExternalResponseCacheService.PERM_CACHE_DURATION;
      cacheMock.get.mockResolvedValueOnce(null);
      apiCallResultsRepoMock.findOneBy.mockResolvedValueOnce(null);

      const result = await service.cacheOrPerform(mockChainId, mockCacheKey, permTTL, mockOnCacheMiss);
      expect(result).toEqual(mockEntity);
      expect(apiCallResultsRepoMock.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ key: mockCacheKey, value: mockEntity }),
        ['key'],
      );
      expect(cacheMock.set).not.toHaveBeenCalled();
    });
  });
});
