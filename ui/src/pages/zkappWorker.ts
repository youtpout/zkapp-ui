import { Account, Bool, Field, Mina, PublicKey, Signature, UInt64, fetchAccount } from 'o1js';

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

// ---------------------------------------------------------------------------------------

import type { WinToken, SaveToken } from '../../../contracts/src/tictacsign';

const state = {
  WinToken: null as null | typeof WinToken,
  SaveToken: null as null | typeof SaveToken,
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
    const { WinToken, SaveToken } = await import('../../../contracts/build/src/tictacsign.js');
    state.WinToken = WinToken as unknown as any;
    state.SaveToken = SaveToken;
  },
  compileContract: async (args: {}) => {
    await state.WinToken!.compile();
    await state.SaveToken!.compile();
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
  createGetRewardTransaction: async (args: {gameState:string, signGame:string, player1:string, sign1:string}) => {
    
    // match with IA private key on godot game
    var player2 = PublicKey.fromBase58("B62qnL3MYoZcmppsLqR7XjS5tAgs3ErMGjM8aL6UpE3tvt5bC23fWo6");
    var oldState = JSON.parse(args.gameState);
    const { GameState } = await import('../../../contracts/build/src/tictacsign.js');
    const newGameState = new GameState({
      board: Field.from(oldState.Board),
      player1 : PublicKey.fromBase58(args.player1),
      player2 : player2,
      nextIsPlayer2: Bool(true),
      startTimeStamp: UInt64.from(oldState.StartTimeStamp),
    });

   
    var pubPlayer1= PublicKey.fromBase58(args.player1);
  
    const sign1 = Signature.fromBase58(args.sign1);
    const sign2 = Signature.fromBase58(args.signGame);

    const transaction = await Mina.transaction(() => {      
      state.zkapp!.getReward(pubPlayer1,sign1,player2,sign2,newGameState);
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