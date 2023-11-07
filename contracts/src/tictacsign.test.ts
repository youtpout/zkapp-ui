import { Add } from './Add';
import {
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  AccountUpdate,
  Signature,
} from 'o1js';
import { SaveToken, WinToken } from './tictacsign';

/*
 * This file specifies how to test the `Add` example smart contract. It is safe to delete this file and replace
 * with your own tests.
 *
 * See https://docs.minaprotocol.com/zkapps for more info.
 */

let proofsEnabled = false;

describe('Tictactsign', () => {
  let deployerAccount: PublicKey,
    deployerKey: PrivateKey,
    senderAccount: PublicKey,
    senderKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppAddress2: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkAppPrivateKey2: PrivateKey,
    player1: PublicKey,
    player1Key: PrivateKey,
    player2: PublicKey,
    player2Key: PrivateKey,
    verificationKey: any,
    verificationKey2: any,
    zkApp: WinToken,
    zkApp2: SaveToken;

  beforeAll(async () => {
    if (proofsEnabled) {
      const { verificationKey: verificationKey } = await WinToken.compile();
      const { verificationKey: verificationKey2 } = await SaveToken.compile();
    }
  });

  beforeEach(() => {
    const Local = Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    ({ privateKey: deployerKey, publicKey: deployerAccount } =
      Local.testAccounts[0]);
    ({ privateKey: senderKey, publicKey: senderAccount } =
      Local.testAccounts[1]);
    ({ privateKey: player1Key, publicKey: player1 } = Local.testAccounts[2]);
    ({ privateKey: player2Key, publicKey: player2 } = Local.testAccounts[3]);

    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();

    zkAppPrivateKey2 = PrivateKey.random();
    zkAppAddress2 = zkAppPrivateKey2.toPublicKey();

    zkApp = new WinToken(zkAppAddress);
    zkApp2 = new SaveToken(zkAppAddress2);
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      zkApp.deploy({ verificationKey, zkappKey: zkAppPrivateKey });
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey]).send();

    const txn2 = await Mina.transaction(deployerAccount, () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      zkApp2.deploy({ zkappKey: zkAppPrivateKey2 });
    });
    await txn2.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn2.sign([deployerKey, zkAppPrivateKey2]).send();
  }

  it('set save address', async () => {
    await localDeploy();

    const init_txn = await Mina.transaction(deployerAccount, () => {
      zkApp.init();
    });
    await init_txn.prove();
    await init_txn.sign([deployerKey, zkAppPrivateKey]).send();

    const txn = await Mina.transaction(deployerAccount, () => {
      zkApp.setSaveContractAddress(zkAppAddress2);
    });
    await txn.prove();
    await txn.sign().send();
  });
});
