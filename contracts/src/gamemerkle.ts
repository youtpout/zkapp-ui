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
} from 'o1js';

const tokenSymbol = 'MON';
const mintAmount = 1_000_000_000;

export class GameAction extends Struct({
  player1: PublicKey,
  player2: PublicKey,
  idAction: UInt64,
  amount: UInt64,
  actionType: UInt32,
}) {
  constructor(value: {
    player1: PublicKey;
    player2: PublicKey;
    idAction: UInt64;
    amount: UInt64;
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

export class GameMerkle extends SmartContract {
  @state(UInt64) totalAmountInCirculation = State<UInt64>();

  // the root is the root hash of our off-chain Merkle tree
  @state(Field) root = State<Field>();

  @state(Field) nonce = State<Field>();

  deploy(args: DeployArgs) {
    super.deploy(args);

    const permissionToEdit = Permissions.proof();

    this.account.permissions.set({
      ...Permissions.default(),
      editState: permissionToEdit,
      setTokenSymbol: permissionToEdit,
      send: permissionToEdit,
      receive: permissionToEdit,
    });
  }
  @method init() {
    super.init();
    this.account.tokenSymbol.set(tokenSymbol);
    this.totalAmountInCirculation.set(UInt64.zero);
  }

  @method updateMerkle(leaf: Field, expectedRoot: Field) {
    // we fetch the on-chain commitment/root
    const oldRoot = this.root.getAndAssertEquals();
    const newTree = new MerkleTree(2);
    newTree.setLeaf(0n, oldRoot);
    newTree.setLeaf(1n, leaf);

    const newRoot = newTree.getRoot();
    expectedRoot.assertEquals(newRoot);

    this.root.set(newTree.getRoot());
  }

  @method deposit(amount: UInt64) {
    let senderUpdate = AccountUpdate.createSigned(this.sender);
    senderUpdate.send({ to: this, amount });
  }

  // pay to a player, use nonce to be sure to don't skip payment or pay twice
  @method payout(amount: UInt64, receiver: PublicKey, newNonce: Field) {
    const actualNonce = this.nonce.getAndAssertEquals();
    newNonce.assertEquals(actualNonce.add(1));
    this.send({ to: receiver, amount });
    // update with new nonce
    this.nonce.set(newNonce);
  }
}
