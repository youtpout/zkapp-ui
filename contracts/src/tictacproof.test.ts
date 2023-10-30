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
    player2Key: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey;

  beforeEach(async () => {
    let Local = Mina.LocalBlockchain({ proofsEnabled: false });
    Mina.setActiveInstance(Local);
    [
      { publicKey: player1, privateKey: player1Key },
      { publicKey: player2, privateKey: player2Key },
    ] = Local.testAccounts;
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
  });

  // it('generates and deploys tictactoe', async () => {
  //   const zkApp = TicTacProof;
  //   const txn = await Mina.transaction(player1, () => {
  //     AccountUpdate.fundNewAccount(player1);
  //     zkApp.deploy();
  //     zkApp.startGame(player1, player2);
  //   });
  //   await txn.prove();
  //   await txn.sign([zkAppPrivateKey, player1Key]).send();
  //   const board = zkApp.gameState.get().board;
  //   expect(board).toEqual(Field(0));
  // });

  it('deploys tictactoe & accepts a correct move', async () => {
    const zkApp = TicTacProof;

    await TicTacProof.compile();

    const state: GameState = {
      board: Field(0),
      player1,
      player2,
      gameDone: Bool(false),
      nextIsPlayer2: Bool(false),
    };
    const proof = await zkApp.startGame(state, player1, player2);

    console.log('start game', proof.toJSON());
    const [x, y] = [Field(0), Field(0)];
    const signature = Signature.create(player1Key, [x, y]);

    const newMove = await zkApp.play(state, player1, signature, x, y, proof);
    console.log('new move', newMove.toJSON());

    const [x2, y2] = [Field(0), Field(1)];
    const signature2 = Signature.create(player2Key, [x2, y2]);

    const move2 = await zkApp.play(
      newMove.publicOutput,
      player2,
      signature2,
      x2,
      y2,
      newMove
    );
    console.log('move2', move2.toJSON());
  });
});
