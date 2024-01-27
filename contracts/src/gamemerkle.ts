/**
 * This file defines the `TicTacToe` smart contract and the helpers it needs.
 */

import {
  Field,
  PublicKey,
  Bool,
  Provable,
  Signature,
  Struct,
  SelfProof,
  ZkProgram,
  SmartContract,
  state,
  Account,
  DeployArgs,
  State,
  UInt64,
  method,
  Permissions,
  Poseidon,
  MerkleWitness,
  MerkleMapWitness,
  MerkleTree,
  AccountUpdate,
  UInt32,
  public_,
  VerificationKey,
} from 'o1js';
import { Witness } from 'o1js/dist/node/lib/merkle_tree';

const tokenSymbol = 'MON';
const mintAmount = 1_000_000_000;
const payoutAction = new UInt32(5);

export class MerkleWitness128 extends MerkleWitness(128) {}

export class GameAction extends Struct({
  player1: PublicKey,
  player2: PublicKey,
  idAction: UInt64,
  amount: UInt64,
  idItem: UInt64,
  actionType: UInt32,
}) {
  constructor(value: {
    player1: PublicKey;
    player2: PublicKey;
    idAction: UInt64;
    amount: UInt64;
    idItem: UInt64;
    actionType: UInt32;
  }) {
    super(value);
  }

  hash(): Field {
    return Poseidon.hash([
      this.player1.x,
      this.player1.isOdd.toField(),
      this.player2.x,
      this.player2.isOdd.toField(),
      new Field(this.idAction.value),
      new Field(this.amount.value),
      new Field(this.idItem.value),
      new Field(this.actionType.value),
    ]);
  }
}

export class BuildMerkle {
  merkle: Field;

  constructor(actualMerkle: Field) {
    this.merkle = actualMerkle;
  }

  build(gameActions: GameAction[]): { merkle: Field; expected: Field } {
    const newTree = new MerkleTree(gameActions.length);
    newTree.fill(gameActions.map((x) => x.hash()));

    const finalMerkle = new MerkleTree(2);
    finalMerkle.setLeaf(0n, this.merkle);
    finalMerkle.setLeaf(1n, newTree.getRoot());

    return { merkle: newTree.getRoot(), expected: finalMerkle.getRoot() };
  }
}

export class PayoutData extends Struct({
  receiver: PublicKey,
  amount: UInt64,
  index: UInt64,
}) {
  constructor(value: { receiver: PublicKey; amount: UInt64; index: UInt64 }) {
    super(value);
  }

  hash(): Field {
    return Poseidon.hash([
      this.receiver.x,
      this.receiver.isOdd.toField(),
      new Field(this.amount.value),
      new Field(this.index.value),
    ]);
  }
}

export class GameMerkle extends SmartContract {
  // the root is the root hash of our off-chain Merkle tree
  @state(Field) root = State<Field>();

  // payment nonce
  @state(UInt64) indexPayout = State<UInt64>();

  events = {
    payout: PayoutData,
  };

  deploy(args: DeployArgs) {
    super.deploy(args);

    this.account.permissions.set({
      ...Permissions.default(),
      editState: Permissions.signature(),
      send: Permissions.signature(),
      setVerificationKey: Permissions.signature(),
    });

    this.account.tokenSymbol.set(tokenSymbol);
  }

  @method updateMerkle(leaf: Field, expectedRoot: Field) {
    // we fetch the on-chain commitment/root
    const oldRoot = this.root.getAndRequireEquals();
    const newTree = new MerkleTree(2);
    newTree.setLeaf(0n, oldRoot);
    newTree.setLeaf(1n, leaf);

    const newRoot = newTree.getRoot();
    expectedRoot.assertEquals(newRoot);

    this.root.set(newTree.getRoot());
  }

  // pay to a player, use nonce to be sure to don't skip payment or pay twice
  @method payout(gameAction: GameAction, witness: MerkleWitness128) {
    gameAction.actionType.assertEquals(payoutAction);
    const actualIndex = this.indexPayout.getAndRequireEquals();

    const expectedRoot = witness.calculateRoot(gameAction.hash());
    const actualRoot = this.root.getAndRequireEquals();
    expectedRoot.assertEquals(actualRoot);

    const index = gameAction.idItem;
    const amount = gameAction.amount;
    const receiver = gameAction.player1;

    index.assertEquals(actualIndex.add(1));
    this.send({ to: receiver, amount });
    // update with new nonce
    this.indexPayout.set(index);

    // emit a event to retrieve deposit
    const data = new PayoutData({ receiver, amount, index });
    this.emitEvent('payout', data);
  }

  @method upgrade(vk: VerificationKey) {
    this.account.verificationKey.set(vk);
  }
}
