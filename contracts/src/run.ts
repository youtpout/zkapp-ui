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
  UInt64,
  Account,
} from 'o1js';
import { WinToken, SaveToken, GameState, Board } from './tictacsign.js';

let Local = Mina.LocalBlockchain({ proofsEnabled: false });
Mina.setActiveInstance(Local);
const [
  { publicKey: player1, privateKey: player1Key },
  { publicKey: player2, privateKey: player2Key },
] = Local.testAccounts;

const zkAppPrivateKey = PrivateKey.random();
const zkAppPublicKey = zkAppPrivateKey.toPublicKey();
const zkApp = new WinToken(zkAppPublicKey);

const zkSavePrivateKey = PrivateKey.random();
const zkSavePublicKey = zkSavePrivateKey.toPublicKey();
const zkSave = new SaveToken(zkSavePublicKey);

const sign = Signature.create(zkAppPrivateKey, zkSavePublicKey.toFields());

// Create a new instance of the contract
console.log('\n\n====== DEPLOYING ======\n\n');
const txn = await Mina.transaction(player1, () => {
  AccountUpdate.fundNewAccount(player1);
  zkApp.deploy({ zkappKey: zkAppPrivateKey });
  AccountUpdate.fundNewAccount(player1);
  zkSave.deploy({ zkappKey: zkSavePrivateKey });
  zkApp.setSaveContractAddress(sign, zkSavePublicKey);
});
await txn.prove();
/**
 * note: this tx needs to be signed with `tx.sign()`, because `deploy` uses `requireSignature()` under the hood,
 * so one of the account updates in this tx has to be authorized with a signature (vs proof).
 * this is necessary for the deploy tx because the initial permissions for all account fields are "signature".
 * (but `deploy()` changes some of those permissions to "proof" and adds the verification key that enables proofs.
 * that's why we don't need `tx.sign()` for the later transactions.)
 */
await txn.sign([zkAppPrivateKey, player1Key, zkSavePrivateKey]).send();

console.log('after transaction');

// initial state
let board = new Board(new Field(0));

console.log('initial state of the zkApp');
let zkAppState = Mina.getAccount(zkAppPublicKey);

for (const i in [0, 1, 2, 3, 4, 5, 6, 7]) {
  console.log('state', i, ':', zkAppState?.zkapp?.appState?.[i].toString());
}

console.log('\ninitial board');
board.printState();

// play
console.log('\n\n====== FIRST MOVE ======\n\n');
await makeMove(player1, player1Key, 0, 0);

// debug
board.printState();

// play
console.log('\n\n====== SECOND MOVE ======\n\n');
await makeMove(player2, player2Key, 1, 0);
// debug
board.printState();

// play
console.log('\n\n====== THIRD MOVE ======\n\n');
await makeMove(player1, player1Key, 1, 1);
// debug
board.printState();

// play
console.log('\n\n====== FOURTH MOVE ======\n\n');
await makeMove(player2, player2Key, 2, 1);

// debug
board.printState();

// play
console.log('\n\n====== FIFTH MOVE ======\n\n');
await makeMove(player1, player1Key, 2, 2);

// debug
board.printState();

let isNextPlayer2 = true;

console.log('did someone win?', isNextPlayer2 ? 'Player 1!' : 'Player 2!');

console.log('board', board.serialize().toJSON());

// cleanup
await getReward(board);

let account = Account(player1, zkApp.token.id);
let amount = await account.balance.get();
console.log('player 1 reward', amount.toString());

async function makeMove(
  currentPlayer: PublicKey,
  currentPlayerKey: PrivateKey,
  x0: number,
  y0: number
) {
  const isPlayer2 = currentPlayer == player2;
  board.update(new Field(x0), new Field(y0), Bool(isPlayer2));
}

async function getReward(board: Board) {
  const gameState: GameState = new GameState({
    board: Field.from(board.serialize()),
    player1,
    player2,
    nextIsPlayer2: Bool(true),
    startTimeStamp: UInt64.from(Date.now()),
  });

  const signPlayer1 = Signature.create(player1Key, [gameState.hash()]);
  const signPlayer2 = Signature.create(player2Key, [gameState.hash()]);

  const txm = await Mina.transaction(player1, () => {
    AccountUpdate.fundNewAccount(player1, 2);
    zkApp.getReward(player1, signPlayer1, player2, signPlayer2, gameState);
  });
  await txm.prove();
  await txm.sign([player1Key, zkAppPrivateKey]).send();
}
