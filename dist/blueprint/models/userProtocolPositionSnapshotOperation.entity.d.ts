import { UserProtocolPositionSnapshotOperationToken } from '../models';
import { UserProtocolPositionSnapshot } from '../models';
import { OperationType } from '../models';
import BigNumber from 'bignumber.js';
import { Relation } from 'typeorm';
export declare class UserProtocolPositionSnapshotOperation {
    id: number;
    operationType: OperationType;
    operationValueUsd: BigNumber;
    adjustmentValueUsd: BigNumber;
    userProtocolPositionSnapshot: Relation<UserProtocolPositionSnapshot>;
    userProtocolPositionSnapshotId: number;
    userProtocolPositionSnapshotOperationTokens: Relation<UserProtocolPositionSnapshotOperationToken[]>;
    warning: object;
    createdAt: Date;
    updatedAt: Date;
}
