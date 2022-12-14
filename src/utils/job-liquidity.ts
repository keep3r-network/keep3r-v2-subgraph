import { Address, log, BigInt } from '@graphprotocol/graph-ts';
import { Job, JobLiquidity, Transaction } from '../../generated/schema';
import { LiquidityAddition as LiquidityAdditionEvent, UnbondLiquidityFromJobCall } from '../../generated/Keep3rV2/Keep3rV2';
import { ZERO_BI } from '../utils/constants';

function getOrCreate(job: Job, liquidity: Address): JobLiquidity {
  const id = buildIdFromJobAndLiquidityAddress(job, liquidity);
  log.info('[JobLiquidity] Get or create {}', [id]);
  let jobLiquidity = JobLiquidity.load(id);
  if (jobLiquidity == null) {
    jobLiquidity = new JobLiquidity(id);
    jobLiquidity.job = job.id;
    jobLiquidity.klp = liquidity.toHexString();
    jobLiquidity.amount = ZERO_BI;
    jobLiquidity.save();
  }
  return jobLiquidity;
}

export function getById(id: string): JobLiquidity {
  const jobLiquidity = JobLiquidity.load(id);
  if (jobLiquidity == null) throw new Error('Job Liquidity not found');
  return jobLiquidity;
}

function buildIdFromJobAndLiquidityAddress(job: Job, liquidityAddress: Address): string {
  return job.id.concat('-').concat(liquidityAddress.toHexString());
}

export function getByJobAndLiquidityAddress(job: Job, liquidityAddress: Address): JobLiquidity {
  return getById(buildIdFromJobAndLiquidityAddress(job, liquidityAddress));
}

function addLiquidity(job: Job, liquidityAddress: Address, amount: BigInt): JobLiquidity {
  const jobLiquidity = getOrCreate(job, liquidityAddress);
  log.info('[Job-Liquidity] Added liquidity {}', [jobLiquidity.id]);
  if (!job.liquiditiesIds.includes(jobLiquidity.id)) {
    const liquiditiesIds = job.liquiditiesIds;
    liquiditiesIds.push(jobLiquidity.id);
    job.liquiditiesIds = liquiditiesIds;
    job.save();
  }
  jobLiquidity.amount = jobLiquidity.amount.plus(amount);
  jobLiquidity.save();
  return jobLiquidity;
}

export function addedLiquidity(job: Job, event: LiquidityAdditionEvent, transaction: Transaction): void {
  const jobLiquidity = addLiquidity(job, event.params._liquidity, event.params._amount);
  log.info('[Job-Liquidity] Added liquidity {}', [jobLiquidity.id]);
}

function reduceLiquidity(job: Job, liquidityAddress: Address, amount: BigInt): JobLiquidity {
  const jobLiquidity = getOrCreate(job, liquidityAddress);
  log.info('[Job-Liquidity] Added liquidity {}', [jobLiquidity.id]);
  jobLiquidity.amount = jobLiquidity.amount.minus(amount);
  jobLiquidity.save();
  return jobLiquidity;
}

export function unbondedLiquidity(job: Job, call: UnbondLiquidityFromJobCall, transaction: Transaction): void {
  const jobLiquidity = reduceLiquidity(job, call.inputs._liquidity, call.inputs._amount);
  log.info('[Job-Liquidity] Unbonded liquidity {}', [jobLiquidity.id]);
}

export function migrated(fromJob: Job, toJob: Job): void {
  log.info('[Job-Liquidity] Migrated from job {} to {}', [fromJob.id, toJob.id]);
  const fromJobLiquiditiesIds = fromJob.liquiditiesIds;
  for (let i: i32 = 0; i < fromJobLiquiditiesIds.length; i++) {
    const jobLiquidity = getById(fromJobLiquiditiesIds[i]);
    const liquidityAddress = Address.fromString(jobLiquidity.klp);
    reduceLiquidity(fromJob, liquidityAddress, jobLiquidity.amount);
    addLiquidity(toJob, liquidityAddress, jobLiquidity.amount);
  }
}
