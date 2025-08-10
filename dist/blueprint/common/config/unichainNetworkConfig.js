"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnichainNetworkConfig = void 0;
const constants_1 = require("../../../constants");
const baseEvmNetworkConfig_1 = require("./baseEvmNetworkConfig");
class UnichainNetworkConfig extends baseEvmNetworkConfig_1.BaseEvmNetworkConfig {
    getInitStartBlock() {
        return 1;
    }
    getNetwork() {
        return Number(constants_1.CHAINID.UNICHAIN);
    }
    getNetworkName() {
        return 'Unichain';
    }
    isContractNameLookupEnabled() {
        return false;
    }
}
exports.UnichainNetworkConfig = UnichainNetworkConfig;
//# sourceMappingURL=unichainNetworkConfig.js.map