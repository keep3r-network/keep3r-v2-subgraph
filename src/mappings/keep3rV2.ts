import { BigInt, log } from '@graphprotocol/graph-ts';
import * as transactionLibrary from '../utils/transaction';
import * as keeperLibrary from '../utils/keeper';
import * as keeperBondLibrary from '../utils/keeper-bond';
import * as jobLibrary from '../utils/job';
import * as jobLiquidityLibrary from '../utils/job-liquidity';
import * as jobCreditLibrary from '../utils/job-credit';
import {
  JobAddition as JobAdditionEvent,
  LiquidityAddition as LiquidityAdditionEvent,
  LiquidityWithdrawal as LiquidityWithdrawalEvent,
  Bonding as BondingEvent,
  Activation as ActivationEvent,
  Withdrawal as WithdrawalEvent,
  TokenCreditAddition as TokenCreditAdditionEvent,
  TokenCreditWithdrawal as TokenCreditWithdrawalEvent,
  JobMigrationSuccessful as JobMigrationSuccessfulEvent,
  KeeperWork as KeeperWorkEvent,
  UnbondLiquidityFromJobCall,
  UnbondCall,
} from '../../generated/Keep3rV2/Keep3rV2';
import { KEEP3R_V1_ADDRESS } from '../utils/constants';

/* -------------------------------------------------------------------------- */
/*                                    Jobs                                    */
/* -------------------------------------------------------------------------- */

export function handleAddJob(event: JobAdditionEvent): void {
  // Event parameters are messed up so jobOwner = job and job = jobOwner
  log.info('[Keep3rV2Handler] Job added {}', [event.params._jobOwner.toHexString()]);
  const transaction = transactionLibrary.getOrCreateFromEvent(event, 'Job-Added');
  jobLibrary.added(event, transaction);
}

export function handleAddLiquidityToJob(event: LiquidityAdditionEvent): void {
  log.info('[Keep3rV2Handler] Added liquidity to job {}', [event.params._job.toHexString()]);
  const transaction = transactionLibrary.getOrCreateFromEvent(event, 'Job-AddedLiquidity');
  const job = jobLibrary.getOrCreateByAddress(event.params._job);
  jobLiquidityLibrary.addedLiquidity(job, event, transaction);
}

export function handleUnbondLiquidityFromJob(call: UnbondLiquidityFromJobCall): void {
  log.info('[Keep3rV2Handler] Liquidity withdrawn from job {}', [call.inputs._job.toHexString()]);
  const transaction = transactionLibrary.getOrCreateFromCall(call, 'Job-UnbondingLiquidity');
  const job = jobLibrary.getOrCreateByAddress(call.inputs._job);
  jobLiquidityLibrary.unbondedLiquidity(job, call, transaction);
}

export function handleLiquidityWithdrawalFromJob(event: LiquidityWithdrawalEvent): void {
  log.info('[Keep3rV2Handler] Liquidity withdrawn from job {}', [event.params._job.toHexString()]);
  const transaction = transactionLibrary.getOrCreateFromEvent(event, 'Job-WithdrawingLiquidity');
  const job = jobLibrary.getOrCreateByAddress(event.params._job);
  jobLiquidityLibrary.withdrawnLiquidity(job, event, transaction);
}

export function handleJobMigrationSuccessful(event: JobMigrationSuccessfulEvent): void {
  log.info('[Keep3rV2Handler] Job migration from {} to {}', [event.params._fromJob.toHexString(), event.params._toJob.toHexString()]);
  const transaction = transactionLibrary.getOrCreateFromEvent(event, 'Job-MigrationSuccessful');
  const fromJob = jobLibrary.getOrCreateByAddress(event.params._fromJob);
  const toJob = jobLibrary.getOrCreateByAddress(event.params._toJob);
  jobLibrary.migrated(fromJob, toJob, transaction);
  jobLiquidityLibrary.migrated(fromJob, toJob);
  jobCreditLibrary.migrated(fromJob, toJob);
}

export function handleAddTokenCreditsToJob(event: TokenCreditAdditionEvent): void {
  log.info('[Keep3rV2Handler] Token credits added to job', []);
  const transaction = transactionLibrary.getOrCreateFromEvent(event, 'Job-TokenCreditsAdded');
  const job = jobLibrary.getOrCreateByAddress(event.params._job);
  jobCreditLibrary.addedCredits(job, event, transaction);
}

export function handleWithdrawTokenCreditsToJob(event: TokenCreditWithdrawalEvent): void {
  log.info('[Keep3rV2Handler] Token credits withdrawn from job', []);
  const transaction = transactionLibrary.getOrCreateFromEvent(event, 'Job-TokenCreditsWithdrawn');
  const job = jobLibrary.getOrCreateByAddress(event.params._job);
  jobCreditLibrary.withdrawnCredits(job, event, transaction);
}

/* -------------------------------------------------------------------------- */
/*                               Keeper actions                               */
/* -------------------------------------------------------------------------- */

export function handleBonding(event: BondingEvent): void {
  log.info('[Keep3rV2Handler] Received bonding event', []);
  const keeper = keeperLibrary.getOrCreate(event.params._keeper);
  const transaction = transactionLibrary.getOrCreateFromEvent(event, 'Keeper-Bonding');
  keeperBondLibrary.handleBonding(keeper, event, transaction);
}

export function handleActivation(event: ActivationEvent): void {
  log.info('[Keep3rV2Handler] Received activation event', []);
  const keeper = keeperLibrary.getByAddress(event.params._keeper);
  const transaction = transactionLibrary.getOrCreateFromEvent(event, 'Keeper-Activation');
  keeperBondLibrary.handleActivation(keeper, event, transaction);
}

export function handleUnbondingFromKeeper(call: UnbondCall): void {
  log.info('[Keep3rV2Handler] Handling keeper unbond call', []);
  const transaction = transactionLibrary.getOrCreateFromCall(call, 'Keeper-Unbonding');
  const keeper = keeperLibrary.getOrCreate(call.from);
  keeperBondLibrary.handleUnbonding(keeper, call, transaction);
}

export function handleWithdrawal(event: WithdrawalEvent): void {
  log.info('[Keep3rV2Handler] Received withdrawal event', []);
  const keeper = keeperLibrary.getByAddress(event.params._keeper);
  const transaction = transactionLibrary.getOrCreateFromEvent(event, 'Keeper-Withdrawal');
  keeperBondLibrary.handleWithdrawal(keeper, event, transaction);
}

/* -------------------------------------------------------------------------- */
/*                                   General                                  */
/* -------------------------------------------------------------------------- */

export function handleWork(event: KeeperWorkEvent): void {
  log.info('[Keep3rV2Handler] Job worked', []);
  const transaction = transactionLibrary.getOrCreateFromEvent(event, 'Keeper-Job-Worked');
  const keeper = keeperLibrary.getOrCreate(event.params._keeper);
  const job = jobLibrary.getOrCreateByAddress(event.params._job);
  jobLibrary.worked(keeper, job, event, transaction);
  if (event.params._credit.toHexString() != KEEP3R_V1_ADDRESS.toHexString()) {
    jobCreditLibrary.consumeCredits(job, event, transaction);
  } else {
    keeperBondLibrary.addReward(keeper, event, transaction);
  }
}
