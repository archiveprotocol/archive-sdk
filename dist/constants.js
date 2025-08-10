"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AXIOS_DEFAULT_CONFIG = exports.TEN_MINS = exports.ONE_MIN = exports.MAX_RETRY_ATTEMPTS = exports.CHAINID = void 0;
var CHAINID;
(function (CHAINID) {
    CHAINID["ETHEREUM"] = "1";
    CHAINID["MATIC"] = "137";
    CHAINID["BSC"] = "56";
    CHAINID["FANTOM"] = "250";
    CHAINID["CELO"] = "42220";
    CHAINID["AVAX"] = "43114";
    CHAINID["XDAI"] = "100";
    CHAINID["ARBITRUM"] = "42161";
    CHAINID["HARMONY"] = "1666600000";
    CHAINID["OPTIMISM"] = "10";
    CHAINID["MUMBAI"] = "80001";
    CHAINID["AURORA"] = "1313161554";
    CHAINID["SOLANA"] = "-8768";
    CHAINID["EVMOS"] = "9001";
    CHAINID["EVMOS_COSMOS"] = "evmos_9001-2";
    CHAINID["OSMOSIS"] = "osmosis-1";
    CHAINID["COSMOSHUB"] = "-1061702";
    CHAINID["RONIN"] = "2020";
    CHAINID["BEACON"] = "eth2";
    CHAINID["BASE"] = "8453";
    CHAINID["AVAX_PCHAIN"] = "-9797";
    CHAINID["ZKSYNC"] = "324";
    CHAINID["SCROLL"] = "534352";
    CHAINID["METIS"] = "1088";
    CHAINID["BERACHAIN_TESTNET"] = "80084";
    CHAINID["BERACHAIN"] = "80094";
    CHAINID["UNICHAIN"] = "130";
})(CHAINID || (exports.CHAINID = CHAINID = {}));
exports.MAX_RETRY_ATTEMPTS = 3;
exports.ONE_MIN = 1000 * 60;
exports.TEN_MINS = exports.ONE_MIN * 10;
exports.AXIOS_DEFAULT_CONFIG = {
    headers: {
        'Accept-Encoding': '*',
    },
    timeout: exports.ONE_MIN,
};
//# sourceMappingURL=constants.js.map