import { Add } from './Add';
import {
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  AccountUpdate,
  Signature,
} from 'o1js';

const alphabet =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'.split('');
let inverseAlphabet: Record<string, number> = {};
alphabet.forEach((c, i) => {
  inverseAlphabet[c] = i;
});

function changeBase(digits: bigint[], base: bigint, newBase: bigint) {
  // 1. accumulate digits into one gigantic bigint `x`
  let x = fromBase(digits, base);
  // 2. compute new digits from `x`
  let newDigits = toBase(x, newBase);
  return newDigits;
}

function fromBase(digits: bigint[], base: bigint) {
  if (base <= 0n) throw Error('fromBase: base must be positive');
  // compute powers base, base^2, base^4, ..., base^(2^k)
  // with largest k s.t. n = 2^k < digits.length
  let basePowers = [];
  for (let power = base, n = 1; n < digits.length; power **= 2n, n *= 2) {
    basePowers.push(power);
  }
  let k = basePowers.length;
  // pad digits array with zeros s.t. digits.length === 2^k
  digits = digits.concat(Array(2 ** k - digits.length).fill(0n));
  // accumulate [x0, x1, x2, x3, ...] -> [x0 + base*x1, x2 + base*x3, ...] -> [x0 + base*x1 + base^2*(x2 + base*x3), ...] -> ...
  // until we end up with a single element
  for (let i = 0; i < k; i++) {
    let newDigits = Array(digits.length >> 1);
    let basePower = basePowers[i];
    for (let j = 0; j < newDigits.length; j++) {
      newDigits[j] = digits[2 * j] + basePower * digits[2 * j + 1];
    }
    digits = newDigits;
  }
  console.assert(digits.length === 1);
  let [digit] = digits;
  return digit;
}

function toBase(x: bigint, base: bigint) {
  if (base <= 0n) throw Error('toBase: base must be positive');
  // compute powers base, base^2, base^4, ..., base^(2^k)
  // with largest k s.t. base^(2^k) < x
  let basePowers = [];
  for (let power = base; power < x; power **= 2n) {
    basePowers.push(power);
  }
  let digits = [x]; // single digit w.r.t base^(2^(k+1))
  // successively split digits w.r.t. base^(2^j) into digits w.r.t. base^(2^(j-1))
  // until we arrive at digits w.r.t. base
  let k = basePowers.length;
  for (let i = 0; i < k; i++) {
    let newDigits = Array(2 * digits.length);
    let basePower = basePowers[k - 1 - i];
    for (let j = 0; j < digits.length; j++) {
      let x = digits[j];
      let high = x / basePower;
      newDigits[2 * j + 1] = high;
      newDigits[2 * j] = x - high * basePower;
    }
    digits = newDigits;
  }
  // pop "leading" zero digits
  while (digits[digits.length - 1] === 0n) {
    digits.pop();
  }
  return digits;
}

function toBase58(bytes: number[] | Uint8Array) {
  // count the leading zeroes. these get turned into leading zeroes in the output
  let z = 0;
  while (bytes[z] === 0) z++;
  // for some reason, this is big-endian, so we need to reverse
  let digits = [...bytes].map(BigInt).reverse();
  // change base and reverse
  let base58Digits = changeBase(digits, 256n, 58n).reverse();
  // add leading zeroes, map into alphabet
  base58Digits = Array(z).fill(0n).concat(base58Digits);
  return base58Digits.map((x) => alphabet[Number(x)]).join('');
}

/*
 * This file specifies how to test the `Add` example smart contract. It is safe to delete this file and replace
 * with your own tests.
 *
 * See https://docs.minaprotocol.com/zkapps for more info.
 */

let proofsEnabled = false;

describe('Add', () => {
  it('Sign message key', async () => {
    const privKey = 'EKDtctFSZuDJ8SXuWcbXHot57gZDtu7dNSAZNZvXek8KF8q6jV8K';
    const pubKey = 'B62qj5tBbE2xyu9k4r7G5npAGpbU1JDBkZm85WCVDMdCrHhS2v2Dy2y';

    const privateKey = PrivateKey.fromBase58(privKey);
    const publickKey = privateKey.toPublicKey();

    let encoded = new TextEncoder().encode('HelloWorld');
    const res = toBase58(encoded);
    console.log('HelloWorld', res);

    const field = Field(123456);
    const signature = Signature.create(privateKey, [field]);

    const pubSign = publickKey.toFields();

    pubSign.forEach((x) => {
      console.log('pub field', x.toJSON());
    });

    console.log('keys', {
      privateKey: privateKey.toJSON(),
      privateKeyString: privateKey.toBase58(),
      publickKey: publickKey.toJSON(),
    });
    console.log('signature', {
      text: '123456',
      field: field.toJSON(),
      signature: signature.toJSON(),
      signatureBase58: signature.toBase58(),
    });

    const verify = signature
      .verify(PublicKey.fromBase58(pubKey), [field])
      .toBoolean();

    expect(verify).toEqual(true);
  });
});
