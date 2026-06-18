import { AbstractRPCSender } from '../../../src/web3-wrapper/rpc/abstractRPCSender';

class TestableRPCSender extends AbstractRPCSender {
  public shouldRetry(error: any): boolean {
    return super.shouldRetry(error);
  }

  public getErrorMessage(error: any, rpcUrl: string): string {
    return super.getErrorMessage(error, rpcUrl);
  }
}

describe('AbstractRPCSender', () => {
  const sender = new TestableRPCSender();

  describe('shouldRetry', () => {
    it('returns true for NETWORK_ERROR code', () => {
      expect(sender.shouldRetry({ code: 'NETWORK_ERROR' })).toBe(true);
    });

    it('returns true for TIMEOUT code', () => {
      expect(sender.shouldRetry({ code: 'TIMEOUT' })).toBe(true);
    });

    it('returns true when nested error.error.code is retryable', () => {
      expect(
        sender.shouldRetry({ code: 'SERVER_ERROR', error: { code: 'TIMEOUT' } }),
      ).toBe(true);
    });

    it.each([402, 403, 429])('returns true for status %d', (status) => {
      expect(sender.shouldRetry({ status })).toBe(true);
    });

    it('returns true for BAD_DATA with nested -32005 rate limit errors', () => {
      const error = {
        code: 'BAD_DATA',
        message: 'missing response for request',
        value: [
          { code: -32005, message: 'Too Many Requests' },
          { code: -32005, message: 'Too Many Requests' },
        ],
      };

      expect(sender.shouldRetry(error)).toBe(true);
    });

    it('returns false for BAD_DATA without nested -32005 errors', () => {
      const error = {
        code: 'BAD_DATA',
        message: 'could not decode result data',
        value: '0x',
      };

      expect(sender.shouldRetry(error)).toBe(false);
    });

    it('returns false for BAD_DATA when value is not an array', () => {
      const error = { code: 'BAD_DATA', value: { code: -32005 } };

      expect(sender.shouldRetry(error)).toBe(false);
    });

    it('returns false for unrelated error codes', () => {
      expect(sender.shouldRetry({ code: 'UNKNOWN_ERROR' })).toBe(false);
    });

    it('returns false for an empty error object', () => {
      expect(sender.shouldRetry({})).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    const rpcUrl = 'https://rpc.example.com';

    it('formats NETWORK_ERROR messages distinctly', () => {
      const error = { code: 'NETWORK_ERROR', message: 'connection refused' };

      expect(sender.getErrorMessage(error, rpcUrl)).toBe(
        `Error connecting to RPC ${rpcUrl}, message: connection refused`,
      );
    });

    it('formats other error codes with the code included', () => {
      const error = { code: 'BAD_DATA', message: 'missing response for request' };

      expect(sender.getErrorMessage(error, rpcUrl)).toBe(
        `Error on RPC ${rpcUrl}, code: BAD_DATA, message: missing response for request`,
      );
    });
  });
});
