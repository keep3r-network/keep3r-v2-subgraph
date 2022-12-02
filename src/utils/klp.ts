import { BigInt, Bytes, ethereum, log } from '@graphprotocol/graph-ts';
import { PairCreated as PairCreatedEvent } from '../../generated/KLPFactory/KLPFactory';
import { KLP, KLPAction, Transaction } from '../../generated/schema';
import { BurnCall, KLP as KLPContract, MintCall, UniswapV3MintCallbackCall } from '../../generated/KLPFactory/KLP';
import * as tokenLibrary from './token';

export function create(event: PairCreatedEvent, transaction: Transaction): KLP {
  const id = event.params._pairManager.toHexString();
  log.info('[KLP] Get or create {}', [id]);
  const klpContract = KLPContract.bind(event.params._pairManager);
  const klpToken = tokenLibrary.getOrCreate(event.params._pairManager);
  const token0 = tokenLibrary.getOrCreate(klpContract.token0());
  const token1 = tokenLibrary.getOrCreate(klpContract.token1());
  const klp = new KLP(id);
  klp.token = klpToken.id;
  klp.token0 = token0.id;
  klp.token1 = token1.id;
  klp.pool = event.params._pool;
  klp.transaction = transaction.id;
  klp.createdAtBlock = transaction.blockNumber;
  klp.createdAtTimestamp = transaction.timestamp;
  klp.save();
  return klp;
}

export function getKLPActionById(id: string): KLPAction {
  const klpAction = KLPAction.load(id);
  if (klpAction == null) throw Error('KLPAction not found');
  return klpAction;
}

function buildKLPActionIdFromTransaction(transaction: Transaction): string {
  return buildKLPActionIdFromHashAndIndex(transaction.hash, transaction.index);
}

function buildKLPActionIdFromHashAndIndex(hash: Bytes, index: BigInt): string {
  return hash.toHexString().concat('-').concat(index.toString());
}

export function mint(call: MintCall, transaction: Transaction): void {
  const id = buildKLPActionIdFromTransaction(transaction);
  log.info('[KLP] Mint {}', [id]);
  const klpAction = new KLPAction(id);
  klpAction.user = call.from;
  klpAction.klp = call.to.toHexString();
  klpAction.action = 'MINT';
  klpAction.liquidity = call.outputs.liquidity;
  klpAction.transaction = transaction.id;
  klpAction.createdAtBlock = transaction.blockNumber;
  klpAction.createdAtTimestamp = transaction.timestamp;
  klpAction.save();
}

export function mintCallback(call: UniswapV3MintCallbackCall): void {
  const id = buildKLPActionIdFromHashAndIndex(call.transaction.hash, call.transaction.index);
  log.info('[KLP] Mint {}', [id]);
  const klpAction = getKLPActionById(id);
  klpAction.amount0 = call.inputs.amount0Owed;
  klpAction.amount1 = call.inputs.amount1Owed;
  klpAction.save();
}

export function burn(call: BurnCall, transaction: Transaction): void {
  const id = buildKLPActionIdFromHashAndIndex(call.transaction.hash, call.transaction.index);
  log.info('[KLP] Burn {}', [id]);
  const klpAction = new KLPAction(id);
  klpAction.user = call.from;
  klpAction.klp = call.to.toHexString();
  klpAction.action = 'BURN';
  klpAction.amount0 = call.outputs.amount0;
  klpAction.amount1 = call.outputs.amount1;
  klpAction.liquidity = call.inputs.liquidity;
  klpAction.transaction = transaction.id;
  klpAction.createdAtBlock = transaction.blockNumber;
  klpAction.createdAtTimestamp = transaction.timestamp;
  klpAction.save();
}
