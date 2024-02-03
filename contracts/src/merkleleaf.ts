/**
 * This file defines the `TicTacToe` smart contract and the helpers it needs.
 */

import {
  PublicKey,
  SmartContract,
  state,
  DeployArgs,
  State,
  UInt64,
  method,
  Permissions,
  AccountUpdate,
  Struct,
  Field,
  Poseidon,
  Provable,
  Reducer,
  Bool,
} from 'o1js';

export class DepositInfo extends Struct({
  salt: Field,
  secret: Field,
  amount: UInt64,
}) {
  constructor(value: { salt: Field; secret: Field; amount: UInt64 }) {
    super(value);
  }

  hash(): Field {
    return Poseidon.hash([
      this.salt,
      this.secret,
      new Field(this.amount.value),
    ]);
  }
}

export class Merkleleaf extends SmartContract {
  @state(Field) rootHash = State<Field>();
  @state(Field) leafIndex = State<Field>();
  @state(Field) leftLeaf = State<Field>();
  commitment = Reducer({ actionType: Field });

  deploy(args: DeployArgs) {
    super.deploy(args);

    this.account.permissions.set({
      ...Permissions.default(),
      editState: Permissions.signature(),
    });
  }

  @method deposit(amount: UInt64, commitment: Field) {
    // can't deposit 0
    amount.greaterThan(UInt64.zero).assertTrue();

    let senderUpdate = AccountUpdate.createSigned(this.sender);
    senderUpdate.send({ to: this, amount });

    let initial = {
      state: Bool(false),
      actionState: Reducer.initialActionState,
    };
    let stateType = Bool;
    let actions = this.commitment.getActions();

    let { state, actionState } = this.commitment.reduce(
      actions,
      stateType,
      (state: Bool, action: Field) => state.or(action.equals(commitment)),
      initial
    );

    // the commitment need to be never added in the reducer to continue
    state.assertFalse();

    let actualIndex = this.leafIndex.getAndRequireEquals();

    this.leafIndex.set(actualIndex.add(1));
  }
}
