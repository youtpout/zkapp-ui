/**
 * This file specifies how to run the `TicTacToe` smart contract locally using the `Mina.LocalBlockchain()` method.
 * The `Mina.LocalBlockchain()` method specifies a ledger of accounts and contains logic for updating the ledger.
 *
 * Please note that this deployment is local and does not deploy to a live network.
 * If you wish to deploy to a live network, please use the zkapp-cli to deploy.
 *
 * To run locally:
 * Build the project: `$ npm run build`
 * Run with node:     `$ node build/src/run.js`.
 */

import {
  Field,
  PrivateKey,
  PublicKey,
  Mina,
  AccountUpdate,
  Signature,
  Bool,
} from 'o1js';
import { TicTacProgram, TicTacProof, Board, GameState } from './tictacproof.js';
//import { WinToken } from './wintoken.js';

let Local = Mina.LocalBlockchain({ proofsEnabled: true });
Mina.setActiveInstance(Local);
const [
  { publicKey: player1, privateKey: player1Key },
  { publicKey: player2, privateKey: player2Key },
] = Local.testAccounts;

const zkAppPrivateKey = PrivateKey.random();
const zkAppPublicKey = zkAppPrivateKey.toPublicKey();

const zkApp = TicTacProgram;
// const zkToken = new WinToken(zkAppPublicKey);
// const { verificationKey } = await WinToken.compile();
await TicTacProgram.compile();

// Create a new instance of the contract
console.log('\n\n====== DEPLOYING TOKEN ======\n\n');
// const txn = await Mina.transaction(player1, () => {
//   AccountUpdate.fundNewAccount(player1);
//   //AccountUpdate.fundNewAccount(player2);
//   //zkToken.deploy({ verificationKey, zkappKey: zkAppPrivateKey });
// });
// await txn.prove();
// await txn.sign([player1Key]).send();

console.log('after transaction');

console.time("run");

const state: GameState = {
  board: Field(0),
  player1,
  player2,
  gameDone: Bool(false),
  nextIsPlayer2: Bool(false),
};

const startGame = await zkApp.startGame(state, player1, player2);

// initial state
let b = startGame.publicOutput.board;

console.log('initial state of the zkApp');
//let zkAppState = Mina.getAccount(zkAppPublicKey);

console.log('state :', JSON.stringify(startGame.publicOutput));

console.log('\ninitial board');
new Board(b).printState();

// play
console.log('\n\n====== FIRST MOVE ======\n\n');
const firstMove = await makeMove(startGame, player1, player1Key, 0, 0);

// debug
b = firstMove.publicOutput.board;
new Board(b).printState();

console.timeEnd("run");
/*
// play
console.log('\n\n====== SECOND MOVE ======\n\n');
await makeMove(player2, player2Key, 1, 0);
// debug
b = zkApp.board.get();
new Board(b).printState();

// play
console.log('\n\n====== THIRD MOVE ======\n\n');
await makeMove(player1, player1Key, 1, 1);
// debug
b = zkApp.board.get();
new Board(b).printState();

// play
console.log('\n\n====== FOURTH MOVE ======\n\n');
await makeMove(player2, player2Key, 2, 1);

// debug
b = zkApp.board.get();
new Board(b).printState();

// play
console.log('\n\n====== FIFTH MOVE ======\n\n');
await makeMove(player1, player1Key, 2, 2);

// debug
b = zkApp.board.get();
new Board(b).printState();

let isNextPlayer2 = zkApp.nextIsPlayer2.get();

console.log('did someone win?', isNextPlayer2 ? 'Player 1!' : 'Player 2!');*/
// cleanup

async function makeMove(
  oldProof: TicTacProof,
  currentPlayer: PublicKey,
  currentPlayerKey: PrivateKey,
  x0: number,
  y0: number
) {
  const [x, y] = [Field(x0), Field(y0)];
  const signature = Signature.create(currentPlayerKey, [x, y]);
  return await zkApp.play(
    oldProof.publicOutput,
    currentPlayer,
    signature,
    x,
    y,
    oldProof
  );
}
