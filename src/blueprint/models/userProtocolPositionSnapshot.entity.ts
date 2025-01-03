import { UserProtocolPositionSnapshotOperation } from '../models';
import { BigNumberNumericTransformer } from './bigNumberNumericTransformer';
import { UserProtocolPosition } from './userProtocolPosition.entity';
import BigNumber from 'bignumber.js';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'user_protocol_position_snapshots' })
@Index(['txHash', 'userProtocolPositionId'], { unique: true })
@Index(['userProtocolPositionId', 'blockNumber'], {})
export class UserProtocolPositionSnapshot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { transformer: new BigNumberNumericTransformer() })
  userPrincipalCostUsd: BigNumber;

  @Column('decimal', { transformer: new BigNumberNumericTransformer() })
  userPrincipalUnitCostUsd: BigNumber;

  @Column('decimal', { transformer: new BigNumberNumericTransformer() })
  positionUsdValueAtBlock: BigNumber;

  @Column('int')
  blockNumber: number;

  @Column('int')
  timestamp: number;

  @Column()
  txHash: string;

  @Column('decimal', { transformer: new BigNumberNumericTransformer() })
  txFeeUsd: BigNumber;

  @Column('decimal', { transformer: new BigNumberNumericTransformer() })
  gasTokenAmount: BigNumber;

  @Column('decimal', { transformer: new BigNumberNumericTransformer() })
  positionSharesAtBlock: BigNumber;

  @Column('decimal', { transformer: new BigNumberNumericTransformer() })
  userPrincipalShares: BigNumber;

  @Column('decimal', { transformer: new BigNumberNumericTransformer(), nullable: true })
  exitRatio: BigNumber;

  @Column('decimal', { transformer: new BigNumberNumericTransformer(), nullable: true })
  exitedCostUsd: BigNumber;

  @Column('decimal', { transformer: new BigNumberNumericTransformer(), nullable: true })
  exitedValueUsd: BigNumber;

  @Column('decimal', { transformer: new BigNumberNumericTransformer(), nullable: true })
  exitedHodlValueUsd: BigNumber;

  @Column('decimal', { transformer: new BigNumberNumericTransformer() })
  ifHeldAllAmountEth: BigNumber;

  @Column('decimal', { transformer: new BigNumberNumericTransformer() })
  ifHeldAllAmountBtc: BigNumber;

  @Column()
  isNewSession: boolean;

  @Column()
  isFullyExitedSession: boolean;

  @Column({ default: false })
  isLiabilityPosition: boolean;

  @Column('int', { default: 0 })
  transactionIndex: number;

  @ManyToOne(() => UserProtocolPosition, (userProtocolPosition) => userProtocolPosition.userProtocolPositionSnapshots, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userProtocolPositionId' })
  public userProtocolPosition: Relation<UserProtocolPosition>;

  @Column()
  public userProtocolPositionId: number;

  @OneToMany(
    () => UserProtocolPositionSnapshotOperation,
    (userProtocolPositionSnapshotOperation) => userProtocolPositionSnapshotOperation.userProtocolPositionSnapshot,
    {
      cascade: true,
      onDelete: 'CASCADE',
    },
  )
  userProtocolPositionSnapshotOperations: Relation<UserProtocolPositionSnapshotOperation[]>;

  @Column({
    type: 'jsonb',
    array: false,
    nullable: true,
  })
  warning: object;

  @CreateDateColumn({ type: 'timestamp without time zone' })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp without time zone',
    nullable: true,
  })
  updatedAt: Date;
}
