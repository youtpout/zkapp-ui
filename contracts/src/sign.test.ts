import {
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  AccountUpdate,
  Signature,
} from 'o1js';
import { sha256 } from 'js-sha256';
import {
  Scalar,
  PrivateKey as PrivateKey2,
} from 'o1js/dist/node/provable/curve-bigint';
import { bytesToBigInt } from 'o1js/dist/node/bindings/crypto/bigint-helpers';
import { sign, verify } from 'o1js/dist/node/mina-signer/src/signature';
import Client from 'o1js/dist/node/mina-signer/MinaSigner';
import { PublicKey as PublicKey2 } from 'o1js/dist/node/provable/curve-bigint.js';

//jest.useFakeTimers();

/*
 * This file specifies how to test the `Add` example smart contract. It is safe to delete this file and replace
 * with your own tests.
 *
 * See https://docs.minaprotocol.com/zkapps for more info.
 */

let proofsEnabled = false;

describe('Sign', () => {
  it('Sign message string', async () => {
    const privKey = 'EKDtctFSZuDJ8SXuWcbXHot57gZDtu7dNSAZNZvXek8KF8q6jV8K';
    const pubKey = 'B62qj5tBbE2xyu9k4r7G5npAGpbU1JDBkZm85WCVDMdCrHhS2v2Dy2y';

    const privateKey = PrivateKey.fromBase58(privKey);
    const publickKey = privateKey.toPublicKey();

    const client = new Client({ network: 'mainnet' });
    const signed = client.signMessage(
      'Hello world welcome in 2023 mina navigator programs',
      privKey
    );

    console.log('signature hello', signed);

    const verify = client.verifyMessage(signed);

    expect(verify).toEqual(true);
  });

  it('Sign message verification failed', async () => {
    const privKey = 'EKDtctFSZuDJ8SXuWcbXHot57gZDtu7dNSAZNZvXek8KF8q6jV8K';
    const pubKey = 'B62qj5tBbE2xyu9k4r7G5npAGpbU1JDBkZm85WCVDMdCrHhS2v2Dy2y';

    const privateKey = PrivateKey.fromBase58(privKey);
    const publickKey = privateKey.toPublicKey();

    const client = new Client({ network: 'mainnet' });
    const signed = client.signMessage(
      'Hello world welcome in 2023 mina navigator programs',
      privKey
    );

    console.log('signature hello', signed);

    const verify = client.verifyMessage({
      data: 'Other message',
      publicKey: publickKey.toBase58(),
      signature: signed.signature,
    });

    expect(verify).toEqual(false);
  });
});
