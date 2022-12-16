import { Address, log, BigInt, dataSource } from '@graphprotocol/graph-ts';
import { Job, Keeper, Transaction, Work } from '../../generated/schema';
import { JobAddition as JobAdditionEvent, KeeperWork as KeeperWorkEvent } from '../../generated/Keep3rV2/Keep3rV2';
import * as jobLiquidityLibrary from './job-liquidity';
import { ZERO_BI } from './constants';

/* -------------------------------------------------------------------------- */
/*                                     Job                                    */
/* -------------------------------------------------------------------------- */

export function getOrCreateByAddress(jobAddress: Address): Job {
  const id = jobAddress.toHexString();
  log.info('[Jobs] Get or create {}', [id]);
  let job = Job.load(id);
  if (job == null) {
    job = new Job(id);
    job.liquiditiesIds = new Array();
    job.creditsIds = new Array();
    job.save();
  }
  return job;
}

export function added(event: JobAdditionEvent, transaction: Transaction): Job {
  const id = event.params._jobOwner.toHexString();
  log.info('[Jobs] Create {}', [id]);
  // We know this seems wrong, but event emits
  // both arguments crossed over so job = jobOwner and jobOwner = job
  const job = getOrCreateByAddress(event.params._jobOwner);
  job.owner = event.params._job;
  job.transaction = transaction.id;
  job.createdAtBlock = transaction.blockNumber;
  job.createdAtTimestamp = transaction.timestamp;
  job.save();
  return job;
}

export function migrated(fromJob: Job, toJob: Job, transaction: Transaction): void {
  log.info('[Jobs] Migrated from job {} to {}', [fromJob.id, toJob.id]);
  fromJob.migratedTo = toJob.id;
  fromJob.save();
}

export function worked(keeper: Keeper, job: Job, event: KeeperWorkEvent, transaction: Transaction): void {
  log.info('[Jobs] Worked job {}', [job.id]);
  const id = job.id.concat('-').concat(transaction.id).concat('-WORK');
  const work = new Work(id);
  work.action = 'WORK';
  work.job = job.id;
  work.keeper = keeper.id;
  work.credit = event.params._credit.toHexString();
  work.payment = event.params._payment;
  if (event.receipt) {
    work.cumulativeGasUsed = event.receipt!.cumulativeGasUsed;
  } else {
    // Best effort approach
    work.cumulativeGasUsed = transaction.gasLimit.minus(event.params._gasLeft).times(transaction.gasPrice);
  }
  work.transaction = transaction.id;
  work.createdAtBlock = transaction.blockNumber;
  work.createdAtTimestamp = transaction.timestamp;
  work.save();
}
