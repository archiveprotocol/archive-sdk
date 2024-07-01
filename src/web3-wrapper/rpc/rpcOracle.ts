import { CHAINID } from '../../constants';
import { RpcInfo } from '../../web3-wrapper/rpc/rpcInfo';

export class RPCOracle {
  private rpcInfos: RpcInfo[];

  constructor(
    private networkId: number | string,
    rpcInfos: RpcInfo[],
  ) {
    // check if networkId passed as parameter exists in CHAINID Enum
    if (!Object.entries(CHAINID).some((e) => e[1] === String(networkId))) {
      throw new Error(`Chain with ID ${networkId} not found.`);
    }
    this.rpcInfos = rpcInfos;
  }

  getRpcCount(): number {
    return this.rpcInfos?.length || 0;
  }

  getNextAvailableRpc(): string {
    let totalWeight = 0;
    for (const rpc of this.rpcInfos) {
      totalWeight += rpc.weight;
    }
    const randomWeight = Math.random() * totalWeight;
    let weightSum = 0;

    for (const rpc of this.rpcInfos) {
      weightSum += rpc.weight;
      if (randomWeight < weightSum) {
        return rpc.url;
      }
    }
  }
}
