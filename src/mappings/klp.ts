import { log } from '@graphprotocol/graph-ts';
import * as klpLibrary from '../utils/klp';
import * as transactionLibrary from '../utils/transaction';
import { PairCreated as PairCreatedEvent } from '../../generated/KLPFactory/KLPFactory';
import { UniswapV3MintCallbackCall, MintCall, BurnCall } from '../../generated/KLPFactory/KLP';
import { KLP } from '../../generated/templates';

export function handlePairCreated(event: PairCreatedEvent): void {
  log.info('[KLPFactory] KLP for pool {} created', [event.params._pool.toHexString()]);
  const transaction = transactionLibrary.getOrCreateFromEvent(event, 'KLP-Created');
  klpLibrary.create(event, transaction);
  KLP.create(event.params._pairManager);
}

export function handleMint(call: MintCall): void {
  log.info('[KLP] Mint', []);
  const transaction = transactionLibrary.getOrCreateFromCall(call, 'KLP-Minted');
  klpLibrary.mint(call, transaction);
}

export function handleMintCallback(call: UniswapV3MintCallbackCall): void {
  log.info('[KLP] Mint callback', []);
  klpLibrary.mintCallback(call);
}

export function handleBurn(call: BurnCall): void {
  log.info('[KLP] Burn', []);
  const transaction = transactionLibrary.getOrCreateFromCall(call, 'KLP-Burnt');
  klpLibrary.burn(call, transaction);
}
