import { BigInt, log } from '@graphprotocol/graph-ts';
import * as transactionLibrary from '../utils/transaction';
import * as keeperLibrary from '../utils/keeper';
import * as bondLibrary from '../utils/bond';
import { Transaction } from '../../generated/schema';
import {
  Unbonding as UnbondingEvent,
  Bonding as BondingEvent,
  Activation as ActivationEvent,
  Withdrawal as WithdrawalEvent,
} from '../../generated/Keep3rV2/Keep3rV2';

export function handleBonding(event: BondingEvent): void {
  log.info('[Keep3rV2Handler] Received bonding event', []);
  const keeper = keeperLibrary.getOrCreate(event.params._keeper);
  const transaction = transactionLibrary.getOrCreateFromEvent(event, 'bonding');
  bondLibrary.handleBonding(keeper, event, transaction);
}

export function handleActivation(event: ActivationEvent): void {
  log.info('[Keep3rV2Handler] Received activation event', []);
  const keeper = keeperLibrary.getByAddress(event.params._keeper);
  const transaction = transactionLibrary.getOrCreateFromEvent(event, 'activation');
  bondLibrary.handleActivation(keeper, event, transaction);
}

export function handleUnbonding(event: UnbondingEvent): void {
  log.info('[Keep3rV2Handler] Received unbonding event', []);
  // An unbonding can be from a keeper, or a job so we need to check it
  const transaction = transactionLibrary.getOrCreateFromEvent(event, 'unbonding');
  if (keeperLibrary.existsByAddress(event.params._keeperOrJob)) {
    const keeper = keeperLibrary.getByAddress(event.params._keeperOrJob);
    bondLibrary.handleUnbonding(keeper, event, transaction);
  }
}

export function handleWithdrawal(event: WithdrawalEvent): void {
  log.info('[Keep3rV2Handler] Received withdrawal event', []);
  const keeper = keeperLibrary.getByAddress(event.params._keeper);
  const transaction = transactionLibrary.getOrCreateFromEvent(event, 'withdrawal');
  bondLibrary.handleWithdrawal(keeper, event, transaction);
}
