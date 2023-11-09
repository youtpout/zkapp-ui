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

const Berkeley = Mina.Network(
  'https://proxy.berkeley.minaexplorer.com/graphql'
);
console.log('Berkeley Instance Created');
Mina.setActiveInstance(Berkeley);

const feePayer = PrivateKey.fromBase58('');

const zkAppPrivateKey = PrivateKey.fromBase58('');

const zkSavePublicKey = PublicKey.fromBase58('');

await WinToken.compile();

const zkAppPublicKey = zkAppPrivateKey.toPublicKey();
const zkApp = new WinToken(zkAppPublicKey);

const sign = Signature.create(zkAppPrivateKey, zkSavePublicKey.toFields());

// Create a new instance of the contract
console.log('\n\n====== UPDATING ======\n\n');
const txn = await Mina.transaction(
  // 0.6 mina fee 9 decimals
  { sender: feePayer.toPublicKey(), fee: '600000000' },
  () => {
    zkApp.setSaveContractAddress(sign, zkSavePublicKey);
  }
);
await txn.prove();
await txn.sign([feePayer]).send();

console.log('after transaction');
