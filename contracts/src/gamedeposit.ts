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
  // the root is the root hash of our off-chain Merkle tree
  @state(PublicKey) GameContract = State<PublicKey>();

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

  @method setContractAddress(contractAddress: PublicKey) {
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
