import { TicTacProof, GameState } from './tictacproof';
import {
  Field,
  Bool,
  PrivateKey,
  PublicKey,
  Mina,
  AccountUpdate,
  Signature,
  SelfProof,
} from 'o1js';

describe('tictacproof', () => {
  let player1: PublicKey,
    player1Key: PrivateKey,
    player2: PublicKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey;

  beforeEach(async () => {
    let Local = Mina.LocalBlockchain({ proofsEnabled: false });
    Mina.setActiveInstance(Local);
    [{ publicKey: player1, privateKey: player1Key }, { publicKey: player2 }] =
      Local.testAccounts;
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
  });

  it('generates and deploys tictactoe', async () => {
    const zkApp = new TicTacProof(zkAppAddress);
    const txn = await Mina.transaction(player1, () => {
      AccountUpdate.fundNewAccount(player1);
      zkApp.deploy();
      zkApp.startGame(player1, player2);
    });
    await txn.prove();
    await txn.sign([zkAppPrivateKey, player1Key]).send();
    const board = zkApp.gameState.get().board;
    expect(board).toEqual(Field(0));
  });

  it('deploys tictactoe & accepts a correct move', async () => {
    const zkApp = new TicTacProof(zkAppAddress);

    // deploy
    let txn = await Mina.transaction(player1, () => {
      AccountUpdate.fundNewAccount(player1);
      zkApp.deploy();
      zkApp.startGame(player1, player2);
    });
    const proofs = await txn.prove();
    await txn.sign([zkAppPrivateKey, player1Key]).send();

    if (proofs?.length > 0) {
      const lastProof = proofs[proofs.length - 1];

      if (lastProof) {
        const proofElem = new SelfProof<GameState, void>({
          proof: lastProof,
          publicInput: lastProof.publicInput as unknown as GameState,
          maxProofsVerified: 1,
          publicOutput: lastProof.publicOutput,
        });
        // move
        const [x, y] = [Field(0), Field(0)];
        const signature = Signature.create(player1Key, [x, y]);
        txn = await Mina.transaction(player1, async () => {
          zkApp.play(player1, signature, x, y, proofElem);
        });
        await txn.prove();

        // check next player
        let isNextPlayer2 = zkApp.gameState.get().nextIsPlayer2;
        expect(isNextPlayer2).toEqual(Bool(true));
      }
    }
  });
});
