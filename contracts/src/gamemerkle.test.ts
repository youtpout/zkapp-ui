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
  VerificationKey,
  Permissions,
  fetchAccount,
} from 'o1js';
import { GameMerkle, BuildMerkle, GameAction } from './gamemerkle';
import { GameDeposit } from './gamedeposit';
import { getBalance } from 'o1js/dist/node/lib/mina';
import { BaseMerkleWitness } from 'o1js/dist/node/lib/merkle_tree';

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
    zkAppPrivateKey: PrivateKey,
    zkDepositAddress: PublicKey,
    zkDepositPrivateKey: PrivateKey,
    player1: PublicKey,
    player1Key: PrivateKey,
    player2: PublicKey,
    player2Key: PrivateKey,
    verificationKey: any,
    verificationKey2: any,
    Local: any,
    zkApp: GameMerkle,
    zkDeposit: GameDeposit;
  beforeAll(async () => {
    if (proofsEnabled) {
      const { verificationKey: verificationKey } = await GameMerkle.compile();
      const { verificationKey: verificationKey2 } = await GameDeposit.compile();
    }
  });

  beforeEach(() => {
    Local = Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    ({ privateKey: deployerKey, publicKey: deployerAccount } =
      Local.testAccounts[0]);
    ({ privateKey: senderKey, publicKey: senderAccount } =
      Local.testAccounts[1]);
    ({ privateKey: player1Key, publicKey: player1 } = Local.testAccounts[2]);
    ({ privateKey: player2Key, publicKey: player2 } = Local.testAccounts[3]);

    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();

    zkDepositPrivateKey = PrivateKey.random();
    zkDepositAddress = zkDepositPrivateKey.toPublicKey();

    zkApp = new GameMerkle(zkAppAddress);
    zkDeposit = new GameDeposit(zkDepositAddress);
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, () => {
      AccountUpdate.fundNewAccount(deployerAccount, 2);
      zkApp.deploy({ verificationKey, zkappKey: zkAppPrivateKey });
      zkDeposit.deploy({
        verificationKey: verificationKey2,
        zkappKey: zkDepositPrivateKey,
      });
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey]).send();
  }

  it('add merkle', async () => {
    await localDeploy();
    await createMerkle(100);
    await createMerkle(50);
  });

  it('upgrade', async () => {
    const compileResult = await GameMerkle.compile();

    const txn = await Mina.transaction(deployerAccount, () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      zkApp.upgrade(compileResult.verificationKey);
      zkApp.requireSignature();
    });
    const proof = await txn.prove();
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  });

  it('payout', async () => {
    Local.addAccount(zkAppAddress, '5000000');
    const amount = new UInt64(1000000);

    const actualMerkle = zkApp.root.get();

    const buildMerkle = new BuildMerkle(actualMerkle);

    const actions: GameAction[] = [];
    for (let index = 0; index < 10; index++) {
      const newAction = new GameAction({
        player1,
        player2,
        actionType: new UInt32(1),
        idAction: new UInt64(index + 1),
        amount: new UInt64(index * 1000),
        idItem: new UInt64(index + 1),
      });
      actions.push(newAction);
    }
    // payout action
    const actionpayout = new GameAction({
      player1,
      player2,
      actionType: new UInt32(2),
      idAction: new UInt64(11),
      amount: amount,
      idItem: new UInt64(1),
    });
    actions.push(actionpayout);

    const result = buildMerkle.build(actions);

    const buildWitness = new BuildMerkle(actualMerkle);
    const witness = buildWitness.getWitnessForAction(actions, actionpayout);

    const txn = await Mina.transaction(deployerAccount, () => {
      zkApp.updateMerkle(result.merkle, result.expected);
      zkApp.requireSignature();
    });
    await txn.prove();
    await txn.sign([deployerKey, zkAppPrivateKey]).send();

    await fetchAccount({ publicKey: zkAppAddress });

    let balance = await getBalance(zkAppAddress);
    let balanceUser = await getBalance(player1);

    const txn2 = await Mina.transaction(deployerAccount, () => {
      zkApp.payout(actionpayout, new BaseMerkleWitness(witness));
      zkApp.requireSignature();
    });
    await txn2.prove();
    await txn2.sign([deployerKey, zkAppPrivateKey]).send();

    const newbalance = await getBalance(zkAppAddress);
    const newbalanceUser = await getBalance(player1);
    expect(newbalance).toEqual(balance.sub(amount));
    expect(newbalanceUser).toEqual(balanceUser.add(amount));
  });

  it('deposit', async () => {
    Local.addAccount(zkAppAddress, '0');
    Local.addAccount(zkDepositAddress, '0');
    const amount = new UInt64(2_000_000_000);

    await fetchAccount({ publicKey: zkAppAddress });

    let balance = await getBalance(zkAppAddress);

    // set owner address
    const tx = await Mina.transaction(deployerAccount, () => {
      zkDeposit.setOwner(player1);
      zkDeposit.requireSignature();
    });
    await tx.prove();
    await tx.sign([deployerKey, player1Key, zkDepositPrivateKey]).send();

    // set contract receiver address
    const txn = await Mina.transaction(deployerAccount, () => {
      zkDeposit.setContractAddress(zkAppAddress);
      zkDeposit.requireSignature();
    });
    await txn.prove();
    await txn.sign([deployerKey, player1Key, zkDepositPrivateKey]).send();

    const txn2 = await Mina.transaction(deployerAccount, () => {
      zkDeposit.deposit(amount);
      zkDeposit.requireSignature();
    });
    await txn2.prove();
    await txn2.sign([deployerKey, zkDepositPrivateKey]).send();

    balance = await getBalance(zkAppAddress);
    expect(balance).toEqual(amount);
  });

  it('check deposit right', async () => {
    Local.addAccount(zkAppAddress, '0');
    Local.addAccount(zkDepositAddress, '0');

    let owner = zkDeposit.Owner.get();
    console.log('owner', owner.toJSON());
    console.log('empty', PublicKey.empty().toJSON());
    // you need private key of newowner if actual owner is empty
    const tx = await Mina.transaction(deployerAccount, () => {
      zkDeposit.setOwner(player1);
      zkDeposit.requireSignature();
    });
    await tx.prove();
    await expect(
      tx.sign([deployerKey, zkDepositPrivateKey]).send()
    ).rejects.toThrow();

    // owner need to be defined to set contract address
    await expect(
      Mina.transaction(deployerAccount, () => {
        zkDeposit.setContractAddress(zkAppAddress);
        zkDeposit.requireSignature();
      })
    ).rejects.toThrow();

    const tx3 = await Mina.transaction(deployerAccount, () => {
      zkDeposit.setOwner(player1);
      zkDeposit.requireSignature();
    });
    await tx3.prove();
    await tx3.sign([deployerKey, zkDepositPrivateKey, player1Key]).send();

    // you need private key of owner to set contract address
    const tx4 = await Mina.transaction(deployerAccount, () => {
      zkDeposit.setContractAddress(zkAppAddress);
      zkDeposit.requireSignature();
    });
    await tx4.prove();
    await expect(
      tx4.sign([deployerKey, zkDepositPrivateKey]).send()
    ).rejects.toThrow();

    const tx5 = await Mina.transaction(deployerAccount, () => {
      zkDeposit.setContractAddress(zkAppAddress);
      zkDeposit.requireSignature();
    });
    await tx5.prove();
    await tx5.sign([deployerKey, player1Key, zkDepositPrivateKey]).send();
  });

  async function createMerkle(size: number) {
    const actualMerkle = zkApp.root.get();

    const buildMerkle = new BuildMerkle(actualMerkle);

    const actions: GameAction[] = [];
    for (let index = 0; index < size; index++) {
      const newAction = new GameAction({
        player1,
        player2,
        actionType: new UInt32(1),
        idAction: new UInt64(index + 1),
        amount: new UInt64(index * 1000),
        idItem: new UInt64(index + 1),
      });
      actions.push(newAction);
    }

    const result = buildMerkle.build(actions);

    const txn = await Mina.transaction(deployerAccount, () => {
      zkApp.updateMerkle(result.merkle, result.expected);
      zkApp.requireSignature();
    });
    await txn.prove();
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }
});
