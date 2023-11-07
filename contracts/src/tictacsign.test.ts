import { Add } from './Add';
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
} from 'o1js';
import { SaveToken, WinToken, GameState } from './tictacsign';

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

  it('cant save address', async () => {
    await localDeploy();

    const sign = Signature.create(deployerKey, zkAppAddress2.toFields());
    const txn = Mina.transaction(deployerAccount, () => {
      zkApp.setSaveContractAddress(sign, zkAppAddress2);
    });
    await expect(txn).rejects.toThrow();
  });

  it('set save address', async () => {
    await localDeploy();

    const oldAddress = await zkApp.saveTokenAddress.get();
    const address0 = PrivateKey.fromBigInt(0n);
    expect(oldAddress.toBase58()).toEqual(address0.toPublicKey().toBase58());

    const sign = Signature.create(zkAppPrivateKey, zkAppAddress2.toFields());
    const txn = await Mina.transaction(deployerAccount, () => {
      zkApp.setSaveContractAddress(sign, zkAppAddress2);
    });
    await txn.prove();
    await txn.sign([deployerKey]).send();

    const newAddress = await zkApp.saveTokenAddress.get();

    expect(zkAppAddress2.toBase58()).toEqual(newAddress.toBase58());
  });

  it('get reward', async () => {
    await localDeploy();

    const sign = Signature.create(zkAppPrivateKey, zkAppAddress2.toFields());
    const txn = await Mina.transaction(deployerAccount, () => {
      zkApp.setSaveContractAddress(sign, zkAppAddress2);
    });
    await txn.prove();
    await txn.sign([deployerKey]).send();

    const gameState: GameState = new GameState({
      board: Field.from(70041),
      player1,
      player2,
      nextIsPlayer2: Bool(true),
      startTimeStamp: UInt64.from(1699392007),
    });

    const signPlayer1 = Signature.create(player1Key, [gameState.hash()]);
    const signPlayer2 = Signature.create(player2Key, [gameState.hash()]);

    const txm = await Mina.transaction(deployerAccount, () => {
      zkApp.getReward(player1, signPlayer1, player2, signPlayer2, gameState);
    });
    await txm.prove();
    await txm.sign([deployerKey]).send();

    let account = Account(player1, zkApp.token.id);
    let amount = await account.balance.get();
    console.log('amount', amount.toBigInt());
  });
});
