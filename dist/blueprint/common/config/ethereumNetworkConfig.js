"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EthereumNetworkConfig = void 0;
const constants_1 = require("../../../constants");
const baseEvmNetworkConfig_1 = require("./baseEvmNetworkConfig");
class EthereumNetworkConfig extends baseEvmNetworkConfig_1.BaseEvmNetworkConfig {
    getInitStartBlock() {
        return 9562480;
    }
    getNetwork() {
        return Number(constants_1.CHAINID.ETHEREUM);
    }
    getNetworkName() {
        return 'Ethereum';
    }
    isContractNameLookupEnabled() {
        return true;
    }
}
exports.EthereumNetworkConfig = EthereumNetworkConfig;
//# sourceMappingURL=ethereumNetworkConfig.js.map