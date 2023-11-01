import { Add } from './Add';
import {
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  AccountUpdate,
  Signature,
} from 'o1js';

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
