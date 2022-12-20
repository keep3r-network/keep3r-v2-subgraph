import { BigInt, Address, log } from '@graphprotocol/graph-ts';
import { KEEP3R_V2_ADDRESS, MAX_BI, ZERO_BI } from './constants';
import * as tokenLibrary from './token';
import { Bond, BondAction, Keeper, Token, Transaction } from '../../generated/schema';

import {
  Unbonding as UnbondingEvent,
  Bonding as BondingEvent,
  Activation as ActivationEvent,
  Withdrawal as WithdrawalEvent,
  Keep3rV2,
  UnbondCall,
} from '../../generated/Keep3rV2/Keep3rV2';

function buildIdFromKeeperAndToken(keeper: Keeper, token: Token): string {
  return keeper.id.concat('-').concat(token.id);
}

function getOrCreateBond(keeper: Keeper, token: Token): Bond {
  const id = buildIdFromKeeperAndToken(keeper, token);
  log.info('[KeeperBond] Get or create {}', [id]);
  let bond = Bond.load(id);
  if (bond == null) {
    bond = new Bond(id);
    bond.keeper = keeper.id;
    bond.token = token.id;
    bond.bonded = ZERO_BI;
    bond.pendingUnbonds = ZERO_BI;
    bond.withdrawableAfter = MAX_BI;
    bond.save();
  }
  return bond;
}

export function getByKeeperAndToken(keeper: Keeper, token: Token): Bond {
  return getById(buildIdFromKeeperAndToken(keeper, token));
}

export function getById(id: string): Bond {
  const bond = Bond.load(id);
  if (bond == null) throw new Error('Bond not found');
  return bond;
}

function handleAction(keeper: Keeper, tokenAddress: Address, action: string, amount: BigInt, transaction: Transaction): Bond {
  const token = tokenLibrary.getOrCreate(tokenAddress);
  const bond = getOrCreateBond(keeper, token);
  const id = bond.id.concat(transaction.id);
  const keep3r = Keep3rV2.bind(KEEP3R_V2_ADDRESS);
  bond.bonded = keep3r.bonds(Address.fromString(keeper.id), tokenAddress);
  let bondAction = BondAction.load(id);
  if (bondAction == null) {
    bondAction = new BondAction(id);
    bondAction.bond = bond.id;
    bondAction.action = action;
    bondAction.amount = amount;
    bondAction.transaction = transaction.id;
    bondAction.createdAtBlock = transaction.blockNumber;
    bondAction.createdAtTimestamp = transaction.timestamp;
    bondAction.save();
  }
  return bond;
}

export function handleBonding(keeper: Keeper, bondingEvent: BondingEvent, transaction: Transaction): void {
  log.info('[KeeperBond] Handle bonding event', []);
  handleAction(keeper, bondingEvent.params._bonding, 'BOND', bondingEvent.params._amount, transaction);
}

export function handleActivation(keeper: Keeper, activationEvent: ActivationEvent, transaction: Transaction): void {
  log.info('[KeeperBond] Handle activation event', []);
  handleAction(keeper, activationEvent.params._bond, 'ACTIVATE', activationEvent.params._amount, transaction);
}

export function handleUnbonding(keeper: Keeper, call: UnbondCall, transaction: Transaction): void {
  log.info('[KeeperBond] Handle unbonding event', []);
  const bond = handleAction(keeper, call.inputs._bonding, 'UNBOND', call.inputs._amount, transaction);
  const keep3rV2 = Keep3rV2.bind(KEEP3R_V2_ADDRESS);
  bond.pendingUnbonds = bond.pendingUnbonds.plus(call.inputs._amount);
  bond.withdrawableAfter = transaction.timestamp.plus(keep3rV2.unbondTime());
  bond.save();
}

export function handleWithdrawal(keeper: Keeper, withdrawingEvent: WithdrawalEvent, transaction: Transaction): void {
  log.info('[KeeperBond] Handle withdrawing event', []);
  const bond = handleAction(keeper, withdrawingEvent.params._bond, 'WITHDRAW', withdrawingEvent.params._amount, transaction);
  bond.pendingUnbonds = ZERO_BI;
  bond.withdrawableAfter = MAX_BI;
  bond.save();
}
