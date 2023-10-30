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
import { GameState, Board } from './tictacproof';

const tokenSymbol = 'WTTP';
const mintAmount = 1;
const verificationKey =
  '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';

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
  @method mint(receiverAddress: PublicKey, proof: Proof<GameState, GameState>) {
    let totalAmountInCirculation = this.totalAmountInCirculation.get();
    this.totalAmountInCirculation.assertEquals(totalAmountInCirculation);

    let newTotalAmountInCirculation = totalAmountInCirculation.add(mintAmount);

    proof.verify();

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
