import { UserProtocolPositionSnapshot } from '../models';
import { Relation } from 'typeorm';
export declare class UserProtocolPosition {
    id: number;
    blueprintId: string;
    userIdentifier: string;
    positionIdentifier: string;
    chainId: number;
    userProtocolPositionSnapshots: Relation<UserProtocolPositionSnapshot[]>;
    createdAt: Date;
    updatedAt: Date;
}
