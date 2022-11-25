import { BigInt, log } from '@graphprotocol/graph-ts';
import * as transactionLibrary from '../utils/transaction';
import * as keeperLibrary from '../utils/keeper';
import * as bondLibrary from '../utils/bond';
import { Transaction } from '../../generated/schema';
import { PairCreated as PairCreatedEvent } from '../../generated/KLPFactory/KLPFactory';
import { MintCall, BurnCall } from '../../generated/KLPFactory/KLP';
import { KLP } from '../../generated/templates';

export function handlePairCreated(event: PairCreatedEvent): void {
  log.info('[KLPFactory] KLP for pool {} created', [event.params._pool.toHexString()]);
  KLP.create(event.params._pairManager);
}

export function handleMint(call: MintCall): void {
  log.info('[KLP] Mint', []);
}

export function handleBurn(call: BurnCall): void {
  log.info('[KLP] Burn', []);
}
