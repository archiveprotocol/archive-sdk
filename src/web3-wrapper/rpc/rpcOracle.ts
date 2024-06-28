import { CHAINID } from '../../constants';

export class RPCOracle {
  private rpcs: string[];
  private currentIndex = -1; // Initialize currentIndex

  constructor(private networkId: number | string, rpcUrls: string[]) {
    // check if networkId passed as parameter exists in CHAINID Enum
    if (!Object.entries(CHAINID).some((e) => e[1] === String(networkId))) {
      throw new Error(`Chain with ID ${networkId} not found.`);
    }
    this.rpcs = this.shuffleRpcUrls(rpcUrls);
  }

  getRpcCount(): number {
    return this.rpcs.length;
  }

  shuffleRpcUrls(rpcUrls: string[]): string[] {
    let shuffledRpcUrls = rpcUrls.slice(); 
    for (let i = shuffledRpcUrls.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledRpcUrls[i], shuffledRpcUrls[j]] = [shuffledRpcUrls[j], shuffledRpcUrls[i]];
    }
    return shuffledRpcUrls;
  }

  getNextAvailableRpc() {
    if (this.rpcs.length === 0) {
      return null;
    }

    this.currentIndex++;

    if (this.currentIndex >= this.rpcs.length) {
      return null;
    }

    const selectedRpc = this.rpcs[this.currentIndex];

    return selectedRpc;
  }
}
