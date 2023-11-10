import { Account, Mina, PublicKey, Signature, fetchAccount } from 'o1js';

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

// ---------------------------------------------------------------------------------------

import type { GameState, WinToken } from '../../../contracts/src/tictacsign';

const state = {
  WinToken: null as null | typeof WinToken,
  zkapp: null as null | WinToken,
  transaction: null as null | Transaction,
};

// ---------------------------------------------------------------------------------------

const functions = {
  setActiveInstanceToBerkeley: async (args: {}) => {
    const Berkeley = Mina.Network(
      'https://proxy.berkeley.minaexplorer.com/graphql'
    );
    console.log('Berkeley Instance Created');
    Mina.setActiveInstance(Berkeley);
  },
  loadContract: async (args: {}) => {
    const { WinToken } = await import('../../../contracts/build/src/tictacsign.js');
    state.WinToken = WinToken;
  },
  compileContract: async (args: {}) => {
    await state.WinToken!.compile();
  },
  fetchAccount: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    return await fetchAccount({ publicKey });
  },
  initZkappInstance: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    state.zkapp = new state.WinToken!(publicKey);
  },
  getAmount: async (player:string) => {
    try{
      const publicKey = PublicKey.fromBase58(player);
      const amount = await Mina.getBalance(publicKey,state.zkapp?.token.id);
      return JSON.stringify(amount.toJSON());
    }
    catch(ex){
      console.log(ex);
    }
    return "0";
  },
  createGetReward: async (player1: PublicKey,player2: PublicKey,sign1:Signature,sign2:Signature, gamestate:GameState) => {
    const transaction = await Mina.transaction(() => {
      state.zkapp!.getReward(player1,sign1,player2,sign2,gamestate);
    });
    state.transaction = transaction;
  },

  proveUpdateTransaction: async (args: {}) => {
    await state.transaction!.prove();
  },
  getTransactionJSON: async (args: {}) => {
    return state.transaction!.toJSON();
  },
};

// ---------------------------------------------------------------------------------------

export type WorkerFunctions = keyof typeof functions;

export type ZkappWorkerRequest = {
  id: number;
  fn: WorkerFunctions;
  args: any;
};

export type ZkappWorkerReponse = {
  id: number;
  data: any;
};

if (typeof window !== 'undefined') {
  addEventListener(
    'message',
    async (event: MessageEvent<ZkappWorkerRequest>) => {
      const returnData = await functions[event.data.fn](event.data.args);

      const message: ZkappWorkerReponse = {
        id: event.data.id,
        data: returnData,
      };
      postMessage(message);
    }
  );
}

console.log('Web Worker Successfully Initialized.');