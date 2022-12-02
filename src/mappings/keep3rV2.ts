import { BigInt, log } from '@graphprotocol/graph-ts';
import * as transactionLibrary from '../utils/transaction';
import * as keeperLibrary from '../utils/keeper';
import * as bondLibrary from '../utils/bond';
import { Transaction } from '../../generated/schema';
import {
  JobAddition as JobAdditionEvent,
  LiquidityAddition as LiquidityAdditionEvent,
  LiquidityWithdrawal as LiquidityWithdrawalEvent,
  Unbonding as UnbondingEvent,
  Bonding as BondingEvent,
  Activation as ActivationEvent,
  Withdrawal as WithdrawalEvent,
} from '../../generated/Keep3rV2/Keep3rV2';

/* -------------------------------------------------------------------------- */
/*                                    Jobs                                    */
/* -------------------------------------------------------------------------- */

export function handleAddJob(event: JobAdditionEvent): void {
  log.info('[Keep3rV2Handler] Job added {}', [event.params._job.toHexString()]);
}

export function handleAddLiquidityToJob(event: LiquidityAdditionEvent): void {
  log.info('[Keep3rV2Handler] Added liquidity to job {}', [event.params._job.toHexString()]);
}

export function handleLiquidityWithdrawal(event: LiquidityWithdrawalEvent): void {
  log.info('[Keep3rV2Handler] Liquidity withdrawn', []);
}

/* -------------------------------------------------------------------------- */
/*                               Keeper actions                               */
/* -------------------------------------------------------------------------- */

export function handleBonding(event: BondingEvent): void {
  log.info('[Keep3rV2Handler] Received bonding event', []);
  const keeper = keeperLibrary.getOrCreate(event.params._keeper);
  const transaction = transactionLibrary.getOrCreateFromEvent(event, 'Keeper-Bonding');
  bondLibrary.handleBonding(keeper, event, transaction);
}

export function handleActivation(event: ActivationEvent): void {
  log.info('[Keep3rV2Handler] Received activation event', []);
  const keeper = keeperLibrary.getByAddress(event.params._keeper);
  const transaction = transactionLibrary.getOrCreateFromEvent(event, 'Keeper-Activation');
  bondLibrary.handleActivation(keeper, event, transaction);
}

export function handleUnbonding(event: UnbondingEvent): void {
  // An unbonding can be from a keeper, or a job so we need to check it
  if (keeperLibrary.existsByAddress(event.params._keeperOrJob)) {
    log.info('[Keep3rV2Handler] Received keeper unbonding event', []);
    const transaction = transactionLibrary.getOrCreateFromEvent(event, 'Keeper-Unbonding');
    const keeper = keeperLibrary.getByAddress(event.params._keeperOrJob);
    bondLibrary.handleUnbonding(keeper, event, transaction);
  } else {
    log.info('[Keep3rV2Handler] Received job unbonding event', []);
    const transaction = transactionLibrary.getOrCreateFromEvent(event, 'Job-Unbonding');
  }
}

export function handleWithdrawal(event: WithdrawalEvent): void {
  log.info('[Keep3rV2Handler] Received withdrawal event', []);
  const keeper = keeperLibrary.getByAddress(event.params._keeper);
  const transaction = transactionLibrary.getOrCreateFromEvent(event, 'Withdrawal');
  bondLibrary.handleWithdrawal(keeper, event, transaction);
}
