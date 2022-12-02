import { BigInt, BigDecimal, Address } from '@graphprotocol/graph-ts';

export const KEEP3R_V2_ADDRESS = Address.fromString('0xeb02addCfD8B773A5FFA6B9d1FE99c566f8c44CC');
export const ADDRESS_ZERO = Address.fromString('0x0000000000000000000000000000000000000000');

export const ZERO_BI = BigInt.fromI32(0);
export const ONE_BI = BigInt.fromI32(1);
export const TWO_BI = BigInt.fromI32(2);
export const ZERO_BD = BigDecimal.fromString('0');
export const ONE_BD = BigDecimal.fromString('1');
export const BI_18 = BigInt.fromI32(18);
export const MAX_BI = BigInt.fromString('115792089237316195423570985008687907853269984665640564039457584007913129639935');
