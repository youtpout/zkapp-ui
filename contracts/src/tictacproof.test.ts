import { TicTacProof, GameState, TicTacProgram } from './tictacproof';
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
    const zkApp = TicTacProgram;

    const { verificationKey } = await TicTacProgram.compile();

    const state: GameState = {
      board: Field(0),
      player1,
      player2,
      gameDone: Bool(false),
      nextIsPlayer2: Bool(false),
    };

    console.time('start game');
    const proof = await zkApp.startGame(player1, player2);
    console.timeEnd('start game');

    console.time('move 1');
    const [x, y] = [Field(0), Field(0)];
    const signature = Signature.create(player1Key, [x, y]);

    const newMove = await zkApp.play(player1, signature, x, y, proof);
    console.timeEnd('move 1');

    console.time('move 2');
    const [x2, y2] = [Field(0), Field(1)];
    const signature2 = Signature.create(player2Key, [x2, y2]);

    const move2 = await zkApp.play(player2, signature2, x2, y2, newMove);
    console.timeEnd('move 2');
  });
});
