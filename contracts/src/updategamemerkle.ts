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
import { GameMerkle } from './gamemerkle.js';
import { GameDeposit } from './gamedeposit.js';

const Berkeley = Mina.Network(
  'https://proxy.berkeley.minaexplorer.com/graphql'
);
console.log('Berkeley Instance Created');
Mina.setActiveInstance(Berkeley);

const feePayer = PrivateKey.fromBase58('');

const zkAppPrivateKey = PrivateKey.fromBase58('');

const zkDepositPrivateKey = PrivateKey.fromBase58('');

const compiled = await GameMerkle.compile();
const compiledDeposit = GameDeposit.compile();

const zkAppPublicKey = zkAppPrivateKey.toPublicKey();
const zkApp = new GameMerkle(zkAppPublicKey);

const zkAppDepositPublicKey = zkDepositPrivateKey.toPublicKey();
const zkAppDeposit = new GameDeposit(zkAppDepositPublicKey);

// Create a new instance of the contract
console.log('\n\n====== UPDATING ======\n\n');
const txn = await Mina.transaction(
  // 0.6 mina fee 9 decimals
  { sender: feePayer.toPublicKey(), fee: '600000000' },
  () => {
    zkApp.upgrade(compiled.verificationKey);
    zkApp.requireSignature();
    zkAppDeposit.setOwner(feePayer.toPublicKey());
    zkAppDeposit.requireSignature();
    zkAppDeposit.setContractAddress(zkAppPublicKey);
    zkAppDeposit.requireSignature();
  }
);
await txn.prove();
await txn.sign([feePayer, zkDepositPrivateKey]).send();

console.log('after transaction');
