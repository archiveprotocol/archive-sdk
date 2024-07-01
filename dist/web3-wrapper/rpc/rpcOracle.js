"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RPCOracle = void 0;
const constants_1 = require("../../constants");
class RPCOracle {
    constructor(networkId, rpcInfos) {
        this.networkId = networkId;
        // check if networkId passed as parameter exists in CHAINID Enum
        if (!Object.entries(constants_1.CHAINID).some((e) => e[1] === String(networkId))) {
            throw new Error(`Chain with ID ${networkId} not found.`);
        }
        this.rpcInfos = rpcInfos;
    }
    getRpcCount() {
        var _a;
        return ((_a = this.rpcInfos) === null || _a === void 0 ? void 0 : _a.length) || 0;
    }
    getNextAvailableRpc() {
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
exports.RPCOracle = RPCOracle;
//# sourceMappingURL=rpcOracle.js.map