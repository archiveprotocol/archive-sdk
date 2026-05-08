import { ethers } from 'ethers';
import { JsonRpcProvider } from 'ethers-v6';
import { CHAINID } from '../../../src/constants';
import { EvmRPCSender } from '../../../src/web3-wrapper';
import { RPCOracle } from '../../../src/web3-wrapper/rpc/rpcOracle';
import { RpcInfo } from '../../../src/web3-wrapper/rpc/rpcInfo';

jest.mock('../../../src/logging/KafkaManager', () => ({
  KafkaManager: {
    getInstance: jest.fn().mockReturnValue(null),
  },
  Queues: {},
}));

jest.mock('../../../src/web3-wrapper/logger', () => ({
  ArchiveLogger: {
    getLogger: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
      addContext: jest.fn(),
    }),
  },
  REQUEST_ID: 'requestId',
}));

jest.mock('@eth-optimism/sdk', () => ({
  asL2Provider: jest.fn().mockImplementation((p) => p),
}));

const rpcs: RpcInfo[] = [
  { url: 'http://rpc1.example.com', weight: 1 },
  { url: 'http://rpc2.example.com', weight: 1 },
];

const makeError = (overrides: Record<string, any>) => Object.assign(new Error('rpc error'), overrides);

function makeSender() {
  return new EvmRPCSender(CHAINID.ETHEREUM, 'ethereum', 'https://proxy.example.com', 'test-request-id');
}

// Force getNextAvailableRpc to return rpcs in order so tests are deterministic
function mockRpcSequence(sender: EvmRPCSender, sequence: RpcInfo[]) {
  let callIndex = 0;
  jest.spyOn(RPCOracle.prototype, 'getNextAvailableRpc').mockImplementation(() => sequence[callIndex++] ?? sequence[sequence.length - 1]);
}

afterEach(() => {
  jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// executeCallOrSendV5
// ---------------------------------------------------------------------------

describe('executeCallOrSendV5', () => {
  it('returns the result of the provider function on success', async () => {
    const sender = makeSender();
    const result = await sender.executeCallOrSendV5(rpcs, async (_) => 42);
    expect(result).toBe(42);
  });

  it('passes a StaticJsonRpcProvider (ethers v5) to the provider function', async () => {
    const sender = makeSender();
    let received: any;
    await sender.executeCallOrSendV5(rpcs, async (p) => { received = p; return 1; });
    expect(received).toBeInstanceOf(ethers.providers.StaticJsonRpcProvider);
  });

  it('retries with a different RPC on 402', async () => {
    const sender = makeSender();
    mockRpcSequence(sender, [rpcs[0], rpcs[1]]);
    const spy = jest.spyOn(sender, 'getProviderForCallV5');

    let attempt = 0;
    await sender.executeCallOrSendV5(rpcs, async (_) => {
      if (attempt++ === 0) throw makeError({ status: 402 });
      return 'ok';
    });

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls[0][0].url).toBe(rpcs[0].url);
    expect(spy.mock.calls[1][0].url).toBe(rpcs[1].url);
  });

  it('retries on 403', async () => {
    const sender = makeSender();
    let callCount = 0;
    await sender.executeCallOrSendV5(rpcs, async (_) => {
      if (callCount++ === 0) throw makeError({ status: 403 });
      return 'ok';
    });
    expect(callCount).toBe(2);
  });

  it('retries on 429', async () => {
    const sender = makeSender();
    let callCount = 0;
    await sender.executeCallOrSendV5(rpcs, async (_) => {
      if (callCount++ === 0) throw makeError({ status: 429 });
      return 'ok';
    });
    expect(callCount).toBe(2);
  });

  it('retries on TIMEOUT error code', async () => {
    const sender = makeSender();
    let callCount = 0;
    await sender.executeCallOrSendV5(rpcs, async (_) => {
      if (callCount++ === 0) throw makeError({ code: 'TIMEOUT' });
      return 'ok';
    });
    expect(callCount).toBe(2);
  });

  it('retries on NETWORK_ERROR error code', async () => {
    const sender = makeSender();
    let callCount = 0;
    await sender.executeCallOrSendV5(rpcs, async (_) => {
      if (callCount++ === 0) throw makeError({ code: 'NETWORK_ERROR' });
      return 'ok';
    });
    expect(callCount).toBe(2);
  });

  it('aborts immediately on a non-retryable error (SERVER_ERROR with no status)', async () => {
    const sender = makeSender();
    let callCount = 0;
    await sender.executeCallOrSendV5(rpcs, async (_) => {
      callCount++;
      throw makeError({ code: 'SERVER_ERROR' });
    });
    expect(callCount).toBe(1);
  });

  it('aborts immediately on INVALID_ARGUMENT', async () => {
    const sender = makeSender();
    let callCount = 0;
    await sender.executeCallOrSendV5(rpcs, async (_) => {
      callCount++;
      throw makeError({ code: 'INVALID_ARGUMENT' });
    });
    expect(callCount).toBe(1);
  });

  it('returns null when all RPCs are exhausted', async () => {
    const sender = makeSender();
    const result = await sender.executeCallOrSendV5(rpcs, async (_) => {
      throw makeError({ code: 'TIMEOUT' });
    });
    expect(result).toBeNull();
  });

  it('throws when throwException is true and all RPCs fail', async () => {
    const sender = makeSender();
    await expect(
      sender.executeCallOrSendV5(
        rpcs,
        async (_) => { throw makeError({ code: 'TIMEOUT' }); },
        true,  // attemptFallback
        false, // logRpcFailure
        true,  // throwException
      ),
    ).rejects.toThrow(/All RPCs failed/);
  });

  it('only tries once when attemptFallback is false', async () => {
    const sender = makeSender();
    let callCount = 0;
    await sender.executeCallOrSendV5(
      rpcs,
      async (_) => { callCount++; throw makeError({ code: 'TIMEOUT' }); },
      false, // attemptFallback
    );
    expect(callCount).toBe(1);
  });

  it('does not call the provider function when rpcProviderFn is undefined', async () => {
    const sender = makeSender();
    await expect(sender.executeCallOrSendV5(rpcs, undefined)).rejects.toThrow('RPC Provider function is not defined');
  });

  it('caches the provider — same instance returned on repeated calls to same RPC', async () => {
    const sender = makeSender();
    const p1 = sender.getProviderForCallV5(rpcs[0]);
    const p2 = sender.getProviderForCallV5(rpcs[0]);
    expect(p1).toBe(p2);
  });
});

// ---------------------------------------------------------------------------
// executeCallOrSendV6
// ---------------------------------------------------------------------------

describe('executeCallOrSendV6', () => {
  it('returns the result of the provider function on success', async () => {
    const sender = makeSender();
    const result = await sender.executeCallOrSendV6(rpcs, async (_) => 42);
    expect(result).toBe(42);
  });

  it('passes a JsonRpcProvider (ethers v6) to the provider function', async () => {
    const sender = makeSender();
    let received: any;
    await sender.executeCallOrSendV6(rpcs, async (p) => { received = p; return 1; });
    expect(received).toBeInstanceOf(JsonRpcProvider);
  });

  it('provider is NOT an ethers v5 StaticJsonRpcProvider', async () => {
    const sender = makeSender();
    let received: any;
    await sender.executeCallOrSendV6(rpcs, async (p) => { received = p; return 1; });
    expect(received).not.toBeInstanceOf(ethers.providers.StaticJsonRpcProvider);
  });

  it('retries with a different RPC on 402', async () => {
    const sender = makeSender();
    mockRpcSequence(sender, [rpcs[0], rpcs[1]]);
    const spy = jest.spyOn(sender, 'getProviderForCallV6');

    let attempt = 0;
    await sender.executeCallOrSendV6(rpcs, async (_) => {
      if (attempt++ === 0) throw makeError({ status: 402 });
      return 'ok';
    });

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls[0][0].url).toBe(rpcs[0].url);
    expect(spy.mock.calls[1][0].url).toBe(rpcs[1].url);
  });

  it('retries on 403', async () => {
    const sender = makeSender();
    let callCount = 0;
    await sender.executeCallOrSendV6(rpcs, async (_) => {
      if (callCount++ === 0) throw makeError({ status: 403 });
      return 'ok';
    });
    expect(callCount).toBe(2);
  });

  it('retries on 429', async () => {
    const sender = makeSender();
    let callCount = 0;
    await sender.executeCallOrSendV6(rpcs, async (_) => {
      if (callCount++ === 0) throw makeError({ status: 429 });
      return 'ok';
    });
    expect(callCount).toBe(2);
  });

  it('retries on TIMEOUT error code', async () => {
    const sender = makeSender();
    let callCount = 0;
    await sender.executeCallOrSendV6(rpcs, async (_) => {
      if (callCount++ === 0) throw makeError({ code: 'TIMEOUT' });
      return 'ok';
    });
    expect(callCount).toBe(2);
  });

  it('retries on NETWORK_ERROR error code', async () => {
    const sender = makeSender();
    let callCount = 0;
    await sender.executeCallOrSendV6(rpcs, async (_) => {
      if (callCount++ === 0) throw makeError({ code: 'NETWORK_ERROR' });
      return 'ok';
    });
    expect(callCount).toBe(2);
  });

  it('aborts immediately on a non-retryable error (SERVER_ERROR with no status)', async () => {
    const sender = makeSender();
    let callCount = 0;
    await sender.executeCallOrSendV6(rpcs, async (_) => {
      callCount++;
      throw makeError({ code: 'SERVER_ERROR' });
    });
    expect(callCount).toBe(1);
  });

  it('aborts immediately on INVALID_ARGUMENT', async () => {
    const sender = makeSender();
    let callCount = 0;
    await sender.executeCallOrSendV6(rpcs, async (_) => {
      callCount++;
      throw makeError({ code: 'INVALID_ARGUMENT' });
    });
    expect(callCount).toBe(1);
  });

  it('returns null when all RPCs are exhausted', async () => {
    const sender = makeSender();
    const result = await sender.executeCallOrSendV6(rpcs, async (_) => {
      throw makeError({ code: 'TIMEOUT' });
    });
    expect(result).toBeNull();
  });

  it('throws when throwException is true and all RPCs fail', async () => {
    const sender = makeSender();
    await expect(
      sender.executeCallOrSendV6(
        rpcs,
        async (_) => { throw makeError({ code: 'TIMEOUT' }); },
        true,  // attemptFallback
        false, // logRpcFailure
        true,  // throwException
      ),
    ).rejects.toThrow(/All RPCs failed/);
  });

  it('only tries once when attemptFallback is false', async () => {
    const sender = makeSender();
    let callCount = 0;
    await sender.executeCallOrSendV6(
      rpcs,
      async (_) => { callCount++; throw makeError({ code: 'TIMEOUT' }); },
      false, // attemptFallback
    );
    expect(callCount).toBe(1);
  });

  it('does not call the provider function when rpcProviderFn is undefined', async () => {
    const sender = makeSender();
    await expect(sender.executeCallOrSendV6(rpcs, undefined)).rejects.toThrow('RPC Provider function is not defined');
  });

  it('caches the provider — same instance returned on repeated calls to same RPC', async () => {
    const sender = makeSender();
    const p1 = sender.getProviderForCallV6(rpcs[0]);
    const p2 = sender.getProviderForCallV6(rpcs[0]);
    expect(p1).toBe(p2);
  });

  it('v5 and v6 caches are independent — different provider instances for same RPC', async () => {
    const sender = makeSender();
    const v5 = sender.getProviderForCallV5(rpcs[0]);
    const v6 = sender.getProviderForCallV6(rpcs[0]);
    expect(v5).not.toBe(v6);
  });
});
