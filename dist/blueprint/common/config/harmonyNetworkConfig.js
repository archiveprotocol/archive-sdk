"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HarmonyNetworkConfig = void 0;
const constants_1 = require("../../../constants");
const baseEvmNetworkConfig_1 = require("./baseEvmNetworkConfig");
class HarmonyNetworkConfig extends baseEvmNetworkConfig_1.BaseEvmNetworkConfig {
    getInitStartBlock() {
        return 10178693;
    }
    getNetwork() {
        return Number(constants_1.CHAINID.HARMONY);
    }
    getNetworkName() {
        return 'Harmony';
    }
    isContractNameLookupEnabled() {
        return false;
    }
}
exports.HarmonyNetworkConfig = HarmonyNetworkConfig;
//# sourceMappingURL=harmonyNetworkConfig.js.map