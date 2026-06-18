export class AbstractRPCSender {
  protected getErrorMessage(error: any, rpcUrl: string): string {
    if (error.code === 'NETWORK_ERROR') {
      return `Error connecting to RPC ${rpcUrl}, message: ${error.message}`;
    } else {
      return `Error on RPC ${rpcUrl}, code: ${error.code}, message: ${error.message}`;
    }
  }

  protected shouldRetry(error: any): boolean {
    const retryErrorCodes = ['NETWORK_ERROR', 'TIMEOUT'];
    // Batched calls surface rate limiting as BAD_DATA with nested -32005 errors in `value`, not as a 429/error.code.
    const isRateLimited = (val: any) =>
      Array.isArray(val) && val.some((e) => e?.code === -32005);

    return (
      retryErrorCodes.includes(error.code) ||
      retryErrorCodes.includes(error.error?.code) ||
      [402, 403, 429].includes(error.status) ||
      (error.code === 'BAD_DATA' && isRateLimited(error.value))
    );
  }
}
