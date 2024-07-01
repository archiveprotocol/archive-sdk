"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvmContractReader = void 0;
const web3_wrapper_1 = require("../..//web3-wrapper");
const utils_1 = require("./utils");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const ethers_1 = require("ethers");
// Please set your favorable and reliable RPC URLs
const rpcs = [
    { url: 'https://polygon-rpc.com', weight: 1 },
    { url: 'https://rpc.ankr.com/polygon', weight: 1 },
];
class EvmContractReader {
    constructor(context) {
        this.context = context;
        this.networkId = context.getNetwork();
    }
    fetchOrCachedTx(txHash) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tx = yield (0, web3_wrapper_1.executeCallOrSend)(rpcs, this.networkId, (provider) => {
                    return provider.getTransaction(txHash);
                });
                if (tx) {
                    return tx;
                }
                return null;
            }
            catch (e) {
                this.context.getLogger().error(e.message);
                return null;
            }
        });
    }
    fetchOrCachedTxReceipt(txHash) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const receipt = yield (0, web3_wrapper_1.executeCallOrSend)(rpcs, this.networkId, (provider) => {
                    return provider.getTransactionReceipt(txHash);
                });
                if (receipt) {
                    return receipt;
                }
                return null;
            }
            catch (e) {
                this.context.getLogger().error(e.message);
                return null;
            }
        });
    }
    getDecimalPlaces(tokenAddrs) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const abi = [
                    // decimals
                    {
                        constant: true,
                        inputs: [],
                        name: 'decimals',
                        outputs: [{ name: '', type: 'uint8' }],
                        type: 'function',
                    },
                ];
                const decimalsPlaces = yield (0, web3_wrapper_1.executeCallOrSend)(rpcs, this.networkId, (provider) => {
                    const contract = new ethers_1.ethers.Contract(tokenAddrs, abi, provider);
                    return contract.decimals();
                });
                return decimalsPlaces;
            }
            catch (e) {
                this.context.getLogger().error(`Could not fetch token decimals: ${e}`);
                return 0;
            }
        });
    }
    fetchOrCachedGasPrice() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const gasPrice = yield (0, web3_wrapper_1.executeCallOrSend)(rpcs, this.networkId, (provider) => {
                    return provider.getGasPrice();
                });
                if (gasPrice) {
                    return (0, bignumber_js_1.default)(gasPrice.toString());
                }
                return null;
            }
            catch (e) {
                this.context.getLogger().error(e.message);
                return null;
            }
        });
    }
    fetchGasUsedInTransaction(txHash, decimals = 18) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const transactionReceipt = yield this.fetchOrCachedTxReceipt(txHash);
            if (!transactionReceipt) {
                return (0, bignumber_js_1.default)(0);
            }
            let gasPrice = (0, bignumber_js_1.default)(((_a = transactionReceipt.effectiveGasPrice) === null || _a === void 0 ? void 0 : _a.toString()) || 0);
            if (gasPrice.isNaN())
                gasPrice = yield this.fetchOrCachedGasPrice();
            const gasUsedInNativeToken = (0, bignumber_js_1.default)(transactionReceipt.gasUsed.toString()).multipliedBy(gasPrice);
            return (0, bignumber_js_1.default)((0, utils_1.formatAsDecimalAwareString)(gasUsedInNativeToken, decimals));
        });
    }
}
exports.EvmContractReader = EvmContractReader;
//# sourceMappingURL=evmContractReader.js.map