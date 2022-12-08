import { Address, log } from '@graphprotocol/graph-ts';
import { Keeper } from '../../generated/schema';

export function getById(id: string): Keeper {
  const keeper = Keeper.load(id);
  if (keeper == null) throw new Error('Keeper not found');
  return keeper;
}

export function getByAddress(address: Address): Keeper {
  return getById(address.toHexString());
}

export function getOrCreate(keeperAddress: Address): Keeper {
  const id = keeperAddress.toHexString();
  log.info('[Keeper] Get or create {}', [id]);
  let keeper = Keeper.load(id);
  if (keeper == null) {
    keeper = new Keeper(id);
    keeper.save();
  }
  return keeper;
}
