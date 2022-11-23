import { Address, BigInt, ethereum, store } from '@graphprotocol/graph-ts';
import { assert, beforeEach, clearStore, dataSourceMock, describe, test } from 'matchstick-as';
import { Token } from '../../generated/schema';
import * as tokenLibrary from '../../src/utils/token';
import { createToken, mockTokenContract } from '../test-utils/token';
import { ADDRESS_ZERO, ONE_BI } from '../../src/utils/constants';

describe('Token library', () => {
  /* -------------------- Set ups environment for each test ------------------- */

  beforeEach(() => {
    clearStore();
    createToken(token1_address, token1_name, token1_symbol, token1_decimals);
  });

  /* ---------------------------------- Tests --------------------------------- */

  describe('getByAddress', () => {
    describe('when entity does not exist', () => {
      test(
        'then it throws',
        () => {
          tokenLibrary.getByAddress(Address.fromString('0x0000000000000000000000000000000000000069'));
        },
        true
      );
    });
    describe('when it does exist', () => {
      test('then it returns entity', () => {
        const token = tokenLibrary.getByAddress(token1_address);
        assert.stringEquals(token.id, token1_id);
      });
    });
  });

  describe('getById', () => {
    describe('when entity does not exist', () => {
      test(
        'then it throws',
        () => {
          tokenLibrary.getById('0x0000000000000000000000000000000000000069');
        },
        true
      );
    });
    describe('when it does exist', () => {
      test('then it returns entity', () => {
        const token = tokenLibrary.getById(token1_id);
        assert.stringEquals(token.id, token1_id);
      });
    });
  });

  describe('createProtocolToken', () => {
    describe('on ethereum', () => {
      beforeEach(() => {
        dataSourceMock.setNetwork('mainnet');
      });
      test('returns correct token entity', () => {
        assertProtocolToken(tokenLibrary.createProtocolToken(), 'Ethereum', 'ETH');
      });
    });
  });
});

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

const token1_address = Address.fromString('0x0000000000000000000000000000000000000001');
const token1_id = token1_address.toHexString();
const token1_name = 'Token 1';
const token1_symbol = 'T1';
const token1_decimals = 18;

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function assertProtocolToken(token: Token, name: string, symbol: string): void {
  assert.stringEquals(token.name, name);
  assert.stringEquals(token.symbol, symbol);
  assert.i32Equals(token.decimals, 18);
  assert.bigIntEquals(token.magnitude, BigInt.fromI32(10).pow(18));
}
