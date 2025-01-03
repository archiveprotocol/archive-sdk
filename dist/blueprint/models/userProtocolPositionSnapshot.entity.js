"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserProtocolPositionSnapshot = void 0;
const models_1 = require("../models");
const bigNumberNumericTransformer_1 = require("./bigNumberNumericTransformer");
const userProtocolPosition_entity_1 = require("./userProtocolPosition.entity");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const typeorm_1 = require("typeorm");
let UserProtocolPositionSnapshot = class UserProtocolPositionSnapshot {
};
exports.UserProtocolPositionSnapshot = UserProtocolPositionSnapshot;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserProtocolPositionSnapshot.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { transformer: new bigNumberNumericTransformer_1.BigNumberNumericTransformer() }),
    __metadata("design:type", bignumber_js_1.default)
], UserProtocolPositionSnapshot.prototype, "userPrincipalCostUsd", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { transformer: new bigNumberNumericTransformer_1.BigNumberNumericTransformer() }),
    __metadata("design:type", bignumber_js_1.default)
], UserProtocolPositionSnapshot.prototype, "userPrincipalUnitCostUsd", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { transformer: new bigNumberNumericTransformer_1.BigNumberNumericTransformer() }),
    __metadata("design:type", bignumber_js_1.default)
], UserProtocolPositionSnapshot.prototype, "positionUsdValueAtBlock", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], UserProtocolPositionSnapshot.prototype, "blockNumber", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], UserProtocolPositionSnapshot.prototype, "timestamp", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserProtocolPositionSnapshot.prototype, "txHash", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { transformer: new bigNumberNumericTransformer_1.BigNumberNumericTransformer() }),
    __metadata("design:type", bignumber_js_1.default)
], UserProtocolPositionSnapshot.prototype, "txFeeUsd", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { transformer: new bigNumberNumericTransformer_1.BigNumberNumericTransformer() }),
    __metadata("design:type", bignumber_js_1.default)
], UserProtocolPositionSnapshot.prototype, "gasTokenAmount", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { transformer: new bigNumberNumericTransformer_1.BigNumberNumericTransformer() }),
    __metadata("design:type", bignumber_js_1.default)
], UserProtocolPositionSnapshot.prototype, "positionSharesAtBlock", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { transformer: new bigNumberNumericTransformer_1.BigNumberNumericTransformer() }),
    __metadata("design:type", bignumber_js_1.default)
], UserProtocolPositionSnapshot.prototype, "userPrincipalShares", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { transformer: new bigNumberNumericTransformer_1.BigNumberNumericTransformer(), nullable: true }),
    __metadata("design:type", bignumber_js_1.default)
], UserProtocolPositionSnapshot.prototype, "exitRatio", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { transformer: new bigNumberNumericTransformer_1.BigNumberNumericTransformer(), nullable: true }),
    __metadata("design:type", bignumber_js_1.default)
], UserProtocolPositionSnapshot.prototype, "exitedCostUsd", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { transformer: new bigNumberNumericTransformer_1.BigNumberNumericTransformer(), nullable: true }),
    __metadata("design:type", bignumber_js_1.default)
], UserProtocolPositionSnapshot.prototype, "exitedValueUsd", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { transformer: new bigNumberNumericTransformer_1.BigNumberNumericTransformer(), nullable: true }),
    __metadata("design:type", bignumber_js_1.default)
], UserProtocolPositionSnapshot.prototype, "exitedHodlValueUsd", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { transformer: new bigNumberNumericTransformer_1.BigNumberNumericTransformer() }),
    __metadata("design:type", bignumber_js_1.default)
], UserProtocolPositionSnapshot.prototype, "ifHeldAllAmountEth", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { transformer: new bigNumberNumericTransformer_1.BigNumberNumericTransformer() }),
    __metadata("design:type", bignumber_js_1.default)
], UserProtocolPositionSnapshot.prototype, "ifHeldAllAmountBtc", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], UserProtocolPositionSnapshot.prototype, "isNewSession", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], UserProtocolPositionSnapshot.prototype, "isFullyExitedSession", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], UserProtocolPositionSnapshot.prototype, "isLiabilityPosition", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], UserProtocolPositionSnapshot.prototype, "transactionIndex", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => userProtocolPosition_entity_1.UserProtocolPosition, (userProtocolPosition) => userProtocolPosition.userProtocolPositionSnapshots, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'userProtocolPositionId' }),
    __metadata("design:type", Object)
], UserProtocolPositionSnapshot.prototype, "userProtocolPosition", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], UserProtocolPositionSnapshot.prototype, "userProtocolPositionId", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => models_1.UserProtocolPositionSnapshotOperation, (userProtocolPositionSnapshotOperation) => userProtocolPositionSnapshotOperation.userProtocolPositionSnapshot, {
        cascade: true,
        onDelete: 'CASCADE',
    }),
    __metadata("design:type", Object)
], UserProtocolPositionSnapshot.prototype, "userProtocolPositionSnapshotOperations", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'jsonb',
        array: false,
        nullable: true,
    }),
    __metadata("design:type", Object)
], UserProtocolPositionSnapshot.prototype, "warning", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp without time zone' }),
    __metadata("design:type", Date)
], UserProtocolPositionSnapshot.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({
        type: 'timestamp without time zone',
        nullable: true,
    }),
    __metadata("design:type", Date)
], UserProtocolPositionSnapshot.prototype, "updatedAt", void 0);
exports.UserProtocolPositionSnapshot = UserProtocolPositionSnapshot = __decorate([
    (0, typeorm_1.Entity)({ name: 'user_protocol_position_snapshots' }),
    (0, typeorm_1.Index)(['txHash', 'userProtocolPositionId'], { unique: true }),
    (0, typeorm_1.Index)(['userProtocolPositionId', 'blockNumber'], {})
], UserProtocolPositionSnapshot);
//# sourceMappingURL=userProtocolPositionSnapshot.entity.js.map