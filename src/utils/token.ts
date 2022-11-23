import { Address, log, BigInt, dataSource } from '@graphprotocol/graph-ts';
import { Token } from '../../generated/schema';
// import { ERC20 } from '../../generated/Hub/ERC20';
import { PROTOCOL_TOKEN_ADDRESS } from './constants';

export function getById(id: string): Token {
  const token = Token.load(id);
  if (token == null) throw Error('Token not found');
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
    if (tokenAddress.equals(PROTOCOL_TOKEN_ADDRESS)) {
      token = createProtocolToken();
    } else {
      token = new Token(id);
      const erc20Contract = ERC20.bind(tokenAddress);
      token.name = erc20Contract.name();
      token.symbol = erc20Contract.symbol();
      token.decimals = erc20Contract.decimals();
      token.magnitude = BigInt.fromI32(10).pow(erc20Contract.decimals() as u8);
    }
    token.save();
  }

  return token;
}

export function createProtocolToken(): Token {
  const token = new Token(PROTOCOL_TOKEN_ADDRESS.toHexString());
  if (
    dataSource.network() == 'mainnet' ||
    dataSource.network() == 'optimism' ||
    dataSource.network() == 'optimism-kovan' ||
    dataSource.network() == 'arbitrum-one' ||
    dataSource.network() == 'arbitrum-rinkeby'
  ) {
    token.name = 'Ethereum';
    token.symbol = 'ETH';
  } else if (dataSource.network() == 'matic' || dataSource.network() == 'mumbai') {
    token.name = 'Matic';
    token.symbol = 'MATIC';
  }
  token.decimals = 18;
  token.magnitude = BigInt.fromI32(10).pow(18);
  return token;
}
