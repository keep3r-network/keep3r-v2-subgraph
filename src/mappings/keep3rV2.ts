import { BigInt, log } from '@graphprotocol/graph-ts';
import { Bonding } from '../../generated/Keep3rV2/Keep3rV2';

export function handleBonding(event: Bonding): void {
  log.debug('[Keep3rV2Handler] Received bonding event', []);
}
