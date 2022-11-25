import { BigInt, Address, log } from '@graphprotocol/graph-ts';
import { ZERO_BI } from '../utils/constants';
import * as tokenLibrary from '../utils/token';
import { Bond, BondAction, Keeper, Token, Transaction } from '../../generated/schema';

import {
  Unbonding as UnbondingEvent,
  Bonding as BondingEvent,
  Activation as ActivationEvent,
  Withdrawal as WithdrawalEvent,
  Keep3rV2,
} from '../../generated/Keep3rV2/Keep3rV2';

function buildIdFromKeeperAndToken(keeper: Keeper, token: Token): string {
  return keeper.id.concat('-').concat(token.id);
}

function getOrCreateBond(keeper: Keeper, token: Token): Bond {
  const id = buildIdFromKeeperAndToken(keeper, token);
  log.info('[Bond] Get or create {}', [id]);
  let bond = Bond.load(id);
  if (bond == null) {
    bond = new Bond(id);
    bond.keeper = keeper.id;
    bond.token = token.id;
    bond.bonded = ZERO_BI;
    bond.save();
  }
  return bond;
}

export function getByKeeperAndToken(keeper: Keeper, token: Token): Bond {
  return getById(buildIdFromKeeperAndToken(keeper, token));
}

export function getById(id: string): Bond {
  const bond = Bond.load(id);
  if (bond == null) throw Error('Bond not found');
  return bond;
}

function handleAction(keeper: Keeper, tokenAddress: Address, action: string, amount: BigInt, transaction: Transaction): void {
  const token = tokenLibrary.getOrCreate(tokenAddress);
  const bond = getOrCreateBond(keeper, token);
  const id = bond.id.concat(transaction.id);
  const keep3r = Keep3rV2.bind(Address.fromString('0xeb02addCfD8B773A5FFA6B9d1FE99c566f8c44CC'));
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
}

export function handleBonding(keeper: Keeper, bondingEvent: BondingEvent, transaction: Transaction): void {
  log.info('[Bond] Handle bonding event', []);
  handleAction(keeper, bondingEvent.params._bonding, 'BOND', bondingEvent.params._amount, transaction);
}

export function handleActivation(keeper: Keeper, activationEvent: ActivationEvent, transaction: Transaction): void {
  log.info('[Bond] Handle activation event', []);
  handleAction(keeper, activationEvent.params._bond, 'ACTIVATE', activationEvent.params._amount, transaction);
}

export function handleUnbonding(keeper: Keeper, unbondingEvent: UnbondingEvent, transaction: Transaction): void {
  log.info('[Bond] Handle unbonding event', []);
  handleAction(keeper, unbondingEvent.params._unbonding, 'UNBOND', unbondingEvent.params._amount, transaction);
}

export function handleWithdrawal(keeper: Keeper, withdrawingEvent: WithdrawalEvent, transaction: Transaction): void {
  log.info('[Bond] Handle withdrawing event', []);
  handleAction(keeper, withdrawingEvent.params._bond, 'WITHDRAW', withdrawingEvent.params._amount, transaction);
}
