import {
  SmartContract,
  state,
  State,
  method,
  DeployArgs,
  Permissions,
  UInt64,
  PublicKey,
  Signature,
  verify,
  Proof,
  Bool,
  Circuit,
  Provable,
} from 'o1js';
import { GameState, TicTacProof } from './tictacproof';

const tokenSymbol = 'WTTP';
const mintAmount = 1;
export class BasicTokenContract extends SmartContract {
  @state(UInt64) totalAmountInCirculation = State<UInt64>();

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

  // can only mint for winner
  @method mint(receiverAddress: PublicKey, proof: TicTacProof) {
    let totalAmountInCirculation = this.totalAmountInCirculation.get();
    this.totalAmountInCirculation.assertEquals(totalAmountInCirculation);

    let newTotalAmountInCirculation = totalAmountInCirculation.add(mintAmount);

    proof.verify();

    // check if it's a winner proof
    proof.publicInput.gameDone.assertEquals(Bool(false));
    proof.publicOutput.gameDone.assertEquals(Bool(true));

    // if next is player2 so player1 win
    const winner = Provable.if<PublicKey>(
      proof.publicOutput.nextIsPlayer2,
      proof.publicOutput.player1,
      proof.publicOutput.player2
    );

    // check you are the winner
    winner.assertEquals(receiverAddress);

    this.token.mint({
      address: receiverAddress,
      amount: mintAmount,
    });

    this.totalAmountInCirculation.set(newTotalAmountInCirculation);
  }
}
