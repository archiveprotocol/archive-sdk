"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RPCOracle = void 0;
const constants_1 = require("../../constants");
class RPCOracle {
    constructor(networkId, rpcUrls) {
        this.networkId = networkId;
        this.currentIndex = -1; // Initialize currentIndex
        // check if networkId passed as parameter exists in CHAINID Enum
        if (!Object.entries(constants_1.CHAINID).some((e) => e[1] === String(networkId))) {
            throw new Error(`Chain with ID ${networkId} not found.`);
        }
        this.rpcs = this.shuffleRpcUrls(rpcUrls);
    }
    getRpcCount() {
        return this.rpcs.length;
    }
    shuffleRpcUrls(rpcUrls) {
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
exports.RPCOracle = RPCOracle;
//# sourceMappingURL=rpcOracle.js.map