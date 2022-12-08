import { Address, log, BigInt, dataSource } from '@graphprotocol/graph-ts';
import { Token } from '../../generated/schema';
import { ERC20Detailed } from '../../generated/Keep3rV2/ERC20Detailed';

export function getById(id: string): Token {
  const token = Token.load(id);
  if (token == null) throw new Error('Token not found');
  return token;
}

export function getByAddress(tokenAddress: Address): Token {
  return getById(tokenAddress.toHexString());
}

export function getOrCreate(tokenAddress: Address): Token {
  const id = tokenAddress.toHexString();
  log.info('[Tokens] Get or create {}', [id]);
  let token = Token.load(id);
  if (token == null) {
    token = new Token(id);
    const erc20Contract = ERC20Detailed.bind(tokenAddress);
    token.name = erc20Contract.name();
    token.symbol = erc20Contract.symbol();
    token.decimals = erc20Contract.decimals();
    token.magnitude = BigInt.fromI32(10).pow(erc20Contract.decimals() as u8);

    token.save();
  }
  return token;
}
