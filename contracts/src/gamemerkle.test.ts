import {
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  AccountUpdate,
  Signature,
  Account,
  UInt64,
  Bool,
  UInt32,
} from 'o1js';
import { GameMerkle, BuildMerkle, GameAction } from './gamemerkle';

/*
 * This file specifies how to test the `Add` example smart contract. It is safe to delete this file and replace
 * with your own tests.
 *
 * See https://docs.minaprotocol.com/zkapps for more info.
 */

let proofsEnabled = false;

describe('Game merkle', () => {
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
    zkApp: GameMerkle;
  beforeAll(async () => {
    if (proofsEnabled) {
      const { verificationKey: verificationKey } = await GameMerkle.compile();
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

    zkApp = new GameMerkle(zkAppAddress);
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      zkApp.deploy({ verificationKey, zkappKey: zkAppPrivateKey });
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey]).send();
  }

  it('add merkle', async () => {
    await localDeploy();

    const actualMerkle = zkApp.root.get();

    const buildMerkle = new BuildMerkle(actualMerkle);

    const actions: GameAction[] = [];
    for (let index = 0; index < 100; index++) {
      const newAction = new GameAction({
        player1,
        player2,
        actionType: new UInt32(1),
        idAction: new UInt64(index + 1),
        amount: new UInt64(index * 1000),
      });
      actions.push(newAction);
    }

    const result = buildMerkle.build(actions);

    const txn = await Mina.transaction(deployerAccount, () => {
      zkApp.updateMerkle(result.merkle, result.expected);
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey]).send();
  });
});
