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

const text = 'Hello world welcome in 2023 mina navigator programs';

describe('Sign', () => {
  /* it('Sign message string', async () => {
    const privKey = 'EKDtctFSZuDJ8SXuWcbXHot57gZDtu7dNSAZNZvXek8KF8q6jV8K';
    const pubKey = 'B62qj5tBbE2xyu9k4r7G5npAGpbU1JDBkZm85WCVDMdCrHhS2v2Dy2y';

    const privateKey = PrivateKey.fromBase58(privKey);
    const publickKey = privateKey.toPublicKey();

    const client = new Client({ network: 'testnet' });
    const signed = client.signMessage(text, privKey);

    console.log(text, signed);

    const verify = client.verifyMessage(signed);

    Signature.fromBase58(
      '7mXFRCcMzD4Rzsmp5QQaHQFpHyDaEGrMExmu7hxSrjBXGAznVppDoFD763F8nNvrK7tsRyqRUqrKJPYFmV3eWnYs3ig4613H'
    );

    expect(verify).toEqual(true);
  });

  it('Sign message verification failed', async () => {
    const privKey = 'EKDtctFSZuDJ8SXuWcbXHot57gZDtu7dNSAZNZvXek8KF8q6jV8K';
    const pubKey = 'B62qj5tBbE2xyu9k4r7G5npAGpbU1JDBkZm85WCVDMdCrHhS2v2Dy2y';

    const privateKey = PrivateKey.fromBase58(privKey);
    const publickKey = privateKey.toPublicKey();

    const client = new Client({ network: 'testnet' });
    const signed = client.signMessage(text, privKey);

    console.log(text, signed);

    const verify = client.verifyMessage({
      data: 'Other message',
      publicKey: publickKey.toBase58(),
      signature: signed.signature,
    });

    expect(verify).toEqual(false);
  });*/

  it('Sign message like auro', async () => {
    const privKey = 'EKDtctFSZuDJ8SXuWcbXHot57gZDtu7dNSAZNZvXek8KF8q6jV8K';
    const pubKey = 'B62qj5tBbE2xyu9k4r7G5npAGpbU1JDBkZm85WCVDMdCrHhS2v2Dy2y';

    const privateKey = PrivateKey.fromBase58(privKey);
    const publickKey = privateKey.toPublicKey();

    const msg =
      'Welcome to the mina asp auth, sign this message to authenticate b715ed91-2dfb-4d4b-a181-4a1257e3c293';

    const client = new Client({ network: 'testnet' });
    const signed = client.signMessage(
      'Welcome to the mina asp auth, sign this message to authenticate b715ed91-2dfb-4d4b-a181-4a1257e3c293',
      privKey
    );

    console.log('Auro verif', signed);

    const verify = client.verifyMessage({
      data: msg,
      publicKey: publickKey.toBase58(),
      signature: signed.signature,
    });

    expect(verify).toEqual(true);
  });

  it('Sign payment', async () => {
    const privKey = 'EKDtctFSZuDJ8SXuWcbXHot57gZDtu7dNSAZNZvXek8KF8q6jV8K';
    const pubKey = 'B62qj5tBbE2xyu9k4r7G5npAGpbU1JDBkZm85WCVDMdCrHhS2v2Dy2y';
    const pubTo = 'B62qkR9Har8apahum18KggGtHbAiumoQ65b6uH4vukaqdh3LZCA9jt5';

    const privateKey = PrivateKey.fromBase58(privKey);
    const publickKey = privateKey.toPublicKey();

    const client = new Client({ network: 'testnet' });
    // Sign and verify a payment
    let signedPayment = client.signPayment(
      {
        to: pubTo,
        from: pubKey,
        amount: 5,
        fee: 1,
        nonce: 0,
        validUntil: 1702800000,
      },
      privKey
    );

    const verify = client.verifyPayment(signedPayment);
    console.log('signature', signedPayment.signature);
    expect(verify).toEqual(true);
  });
});
