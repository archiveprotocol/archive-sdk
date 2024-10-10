/**
 * Represents a TransactionDetails from the blueprint
 */
export declare class TransactionDetails {
  txHash: string;
  blockNumber: number;
  timestamp: number;
  constructor(txHash: string, blockNumber?: number, timestamp?: number);
  static asUniqueList(a: TransactionDetails[]): TransactionDetails[];
}
export declare class TransactionDetailsWithHeadBlock {
  headBlock: number;
  transactionDetails: TransactionDetails[];
  constructor(headBlock: number, transactionDetails: TransactionDetails[]);
}
export declare class TransactionData {
  transactionDetails: TransactionDetails;
  transactionIndex: number;
  isLast: boolean;
  constructor(transactionDetails: TransactionDetails, transactionIndex: number, isLast: boolean);
}
