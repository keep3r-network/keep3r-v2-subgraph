import { Address, log, BigInt } from '@graphprotocol/graph-ts';
import { CreditAction, Job, JobCredit, Token, Transaction } from '../../generated/schema';
import { ZERO_BI } from './constants';
import {
  TokenCreditAddition as TokenCreditAdditionEvent,
  TokenCreditWithdrawal as TokenCreditWithdrawalEvent,
} from '../../generated/Keep3rV2/Keep3rV2';
import * as tokenLibrary from './token';

function getOrCreate(job: Job, tokenAddress: Address): JobCredit {
  const id = buildIdFromJobAndTokenAddress(job, tokenAddress);
  log.info('[JobCredit] Get or create {}', [id]);
  const token = tokenLibrary.getOrCreate(tokenAddress);
  let jobCredit = JobCredit.load(id);
  if (jobCredit == null) {
    jobCredit = new JobCredit(id);
    jobCredit.job = job.id;
    jobCredit.token = token.id;
    jobCredit.amount = ZERO_BI;
    jobCredit.save();
  }
  return jobCredit;
}

export function getById(id: string): JobCredit {
  const jobCredit = JobCredit.load(id);
  if (jobCredit == null) throw new Error('Job Credit not found');
  return jobCredit;
}

function buildIdFromJobAndTokenAddress(job: Job, tokenAddress: Address): string {
  return job.id.concat('-').concat(tokenAddress.toHexString());
}

export function getByJobAndLiquidityAddress(job: Job, tokenAddress: Address): JobCredit {
  return getById(buildIdFromJobAndTokenAddress(job, tokenAddress));
}

function createAction(job: Job, action: string, tokenAddress: Address, amount: BigInt, transaction: Transaction): void {
  const id = job.id.concat('-').concat(transaction.id);
  const creditAction = new CreditAction(id);
  creditAction.job = job.id;
  creditAction.action = action;
  creditAction.token = tokenAddress.toHexString();
  creditAction.amount = amount;
  creditAction.transaction = transaction.id;
  creditAction.createdAtBlock = transaction.blockNumber;
  creditAction.createdAtTimestamp = transaction.timestamp;
  creditAction.save();
}

function addCredit(job: Job, tokenAddress: Address, amount: BigInt): JobCredit {
  const jobCredit = getOrCreate(job, tokenAddress);
  log.info('[Job-Credit] Added credit {}', [jobCredit.id]);
  if (!job.creditsIds.includes(jobCredit.id)) {
    const creditsIds = job.creditsIds;
    creditsIds.push(jobCredit.id);
    job.creditsIds = creditsIds;
    job.save();
  }
  jobCredit.amount = jobCredit.amount.plus(amount);
  jobCredit.save();
  return jobCredit;
}

export function addedCredits(job: Job, event: TokenCreditAdditionEvent, transaction: Transaction): void {
  const jobCredit = addCredit(job, event.params._token, event.params._amount);
  log.info('[Job-Credit] Added credit {}', [jobCredit.id]);
  createAction(job, 'ADD_CREDITS', event.params._token, event.params._amount, transaction);
}

function reduceCredit(job: Job, tokenAddress: Address, amount: BigInt): JobCredit {
  const jobCredit = getOrCreate(job, tokenAddress);
  log.info('[Job-Credit] Added credit {}', [jobCredit.id]);
  jobCredit.amount = jobCredit.amount.minus(amount);
  jobCredit.save();
  return jobCredit;
}

export function withdrawnCredits(job: Job, event: TokenCreditWithdrawalEvent, transaction: Transaction): void {
  const jobCredit = reduceCredit(job, event.params._token, event.params._amount);
  log.info('[Job-Credit] Withdrawn credit {}', [jobCredit.id]);
  createAction(job, 'REMOVE_CREDITS', event.params._token, event.params._amount, transaction);
}

export function migrated(fromJob: Job, toJob: Job): void {
  log.info('[Job-Credit] Migrated from job {} to {}', [fromJob.id, toJob.id]);
  const fromJobCreditsIds = fromJob.creditsIds;
  for (let i: i32 = 0; i < fromJobCreditsIds.length; i++) {
    const jobCredit = getById(fromJobCreditsIds[i]);
    const tokenAddress = Address.fromString(jobCredit.token);
    reduceCredit(fromJob, tokenAddress, jobCredit.amount);
    addCredit(toJob, tokenAddress, jobCredit.amount);
  }
}
