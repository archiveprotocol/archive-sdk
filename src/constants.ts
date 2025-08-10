export enum CHAINID {
  ETHEREUM = '1',
  MATIC = '137',
  BSC = '56',
  FANTOM = '250',
  CELO = '42220',
  AVAX = '43114',
  XDAI = '100',
  ARBITRUM = '42161',
  HARMONY = '1666600000',
  OPTIMISM = '10',
  MUMBAI = '80001',
  AURORA = '1313161554',
  SOLANA = '-8768', // following defi price convention
  EVMOS = '9001',
  EVMOS_COSMOS = 'evmos_9001-2',
  OSMOSIS = 'osmosis-1',
  COSMOSHUB = '-1061702', // following defi price convention
  RONIN = '2020',
  BEACON = 'eth2',
  BASE = '8453',
  AVAX_PCHAIN = '-9797',
  ZKSYNC = '324',
  SCROLL = '534352',
  METIS = '1088',
  BERACHAIN_TESTNET = '80084',
  BERACHAIN = '80094',
  UNICHAIN = '130'
}

export const MAX_RETRY_ATTEMPTS = 3;

export const ONE_MIN = 1000 * 60;
export const TEN_MINS = ONE_MIN * 10;

export const AXIOS_DEFAULT_CONFIG = {
  headers: {
    'Accept-Encoding': '*',
  },
  timeout: ONE_MIN,
};
