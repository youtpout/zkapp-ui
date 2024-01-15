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
} from 'o1js';

export class DepositData extends Struct({
  user: PublicKey,
  amount: UInt64,
}) {
  constructor(value: { user: PublicKey; amount: UInt64 }) {
    super(value);
  }

  hash(): Field {
    return Poseidon.hash([
      this.user.x,
      this.user.isOdd.toField(),
      new Field(this.amount.value),
    ]);
  }
}

export class GameDeposit extends SmartContract {
  @state(PublicKey) GameContract = State<PublicKey>();
  @state(PublicKey) Owner = State<PublicKey>();

  events = {
    deposit: DepositData,
  };

  deploy(args: DeployArgs) {
    super.deploy(args);

    this.account.permissions.set({
      ...Permissions.default(),
      editState: Permissions.signature(),
    });
  }

  @method setOwner(newOwner: PublicKey) {
    // define owner of the contract to update info like owner and contract address
    const actualOwner = this.Owner.getAndRequireEquals();
    const contractOwner = Provable.if<PublicKey>(
      actualOwner.equals(PublicKey.empty()),
      newOwner,
      actualOwner
    );
    AccountUpdate.createSigned(contractOwner);

    this.Owner.set(newOwner);
  }

  @method setContractAddress(contractAddress: PublicKey) {
    const actualOwner = this.Owner.getAndRequireEquals();
    // don't set is the owner is not defined
    actualOwner.isEmpty().assertFalse();
    AccountUpdate.createSigned(actualOwner);
    this.GameContract.set(contractAddress);
  }

  @method deposit(amount: UInt64) {
    // can't deposit 0
    amount.greaterThan(UInt64.zero).assertTrue();

    let senderUpdate = AccountUpdate.createSigned(this.sender);
    const contractAddress = this.GameContract.getAndRequireEquals();
    // don't send is the contract is not defined
    contractAddress.isEmpty().assertFalse();
    senderUpdate.send({ to: contractAddress, amount });

    // emit a event to retrieve deposit
    const data = new DepositData({ user: this.sender, amount });
    this.emitEvent('deposit', data);
  }
}
