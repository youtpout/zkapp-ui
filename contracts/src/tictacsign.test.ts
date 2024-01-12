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

  it('test sign', async () => {
    const play1 = 'B62qk7R5wo6WTwYSpBHPtfikGvkuasJGEv4ZsSA2sigJdqJqYsWUzA1';
    const play2 = 'B62qnL3MYoZcmppsLqR7XjS5tAgs3ErMGjM8aL6UpE3tvt5bC23fWo6';

    return;
    // for test purpose
    const key1 = '';
    const key2 = '';

    console.log(
      'account1',
      PrivateKey.fromBase58(key1).toPublicKey().toBase58()
    );
    const gameState: GameState = new GameState({
      board: Field.from(70041),
      player1: PublicKey.fromBase58(play1),
      player2: PublicKey.fromBase58(play2),
      nextIsPlayer2: Bool(true),
      startTimeStamp: UInt64.from('1699664476'),
    });

    console.log('hash', gameState.hash().toString());

    const signPlayer1 = Signature.create(PrivateKey.fromBase58(key1), [
      gameState.hash(),
    ]);
    const signPlayer2 = Signature.create(PrivateKey.fromBase58(key2), [
      gameState.hash(),
    ]);

    console.log('sign1', signPlayer1.toBase58());
    console.log('sign2', signPlayer2.toBase58());
  });

  it('get reward', async () => {
    await localDeploy();

    const sign = Signature.create(zkAppPrivateKey, zkAppAddress2.toFields());
    const txn = await Mina.transaction(deployerAccount, () => {
      zkApp.setSaveContractAddress(sign, zkAppAddress2);
    });
    await txn.prove();
    await txn.sign([deployerKey]).send();

    await getReward(UInt64.from(1699392007));

    let account = Account(player1, zkApp.token.id);
    let amount = await account.balance.get();
    let account2 = Account(player1, zkApp2.token.id);
    let amount2 = await account2.balance.get();

    expect(amount.toBigInt()).toEqual(1n);
    expect(amount2.toBigInt()).toEqual(1699392007n);
  });

  it('second get reward failed', async () => {
    await localDeploy();

    const compileResult = await SaveToken.compile();

    const sign = Signature.create(zkAppPrivateKey, zkAppAddress2.toFields());
    const txn = await Mina.transaction(deployerAccount, () => {
      zkApp.setSaveContractAddress(sign, zkAppAddress2);
    });
    const proof = await txn.prove();
    await txn.sign([deployerKey]).send();

    await getReward(UInt64.from(1699392007));

    const tx2 = getReward(UInt64.from(1699392007));
    // if we reuse timestamp it will fail
    await expect(tx2).rejects.toThrow();

    // we increment timestamp is success
    await getReward(UInt64.from(1699392008));

    let account = Account(player1, zkApp.token.id);
    let amount = await account.balance.get();
    let account2 = Account(player1, zkApp2.token.id);
    let amount2 = await account2.balance.get();

    expect(amount.toBigInt()).toEqual(2n);
    expect(amount2.toBigInt()).toEqual(1699392008n);

    const tx3 = getReward(UInt64.from(15));
    // if we timestamp is lower than actual it will fail
    await expect(tx3).rejects.toThrow();
  });

  async function getReward(timestamp: UInt64) {
    const gameState: GameState = new GameState({
      board: Field.from(70041),
      player1,
      player2,
      nextIsPlayer2: Bool(true),
      startTimeStamp: UInt64.from(timestamp),
    });

    const signPlayer1 = Signature.create(player1Key, [gameState.hash()]);
    const signPlayer2 = Signature.create(player2Key, [gameState.hash()]);

    let accountToUpdate = 0;
    const account1 = Account(player1, zkApp.token.id);
    const isNew1 = await account1.isNew.get().toBoolean();
    if (isNew1) {
      accountToUpdate++;
    }
    const account2 = await Account(player1, zkApp2.token.id);
    const isNew2 = await account2.isNew.get().toBoolean();
    if (isNew2) {
      accountToUpdate++;
    }

    const txm = await Mina.transaction(player1, () => {
      AccountUpdate.fundNewAccount(player1, accountToUpdate);
      zkApp.getReward(player1, signPlayer1, player2, signPlayer2, gameState);
    });
    await txm.prove();
    await txm.sign([player1Key]).send();
  }
});
