import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { GameMerkle, GameAction, BuildMerkle } from '../../../contracts/src/gamemerkle';
import { Field, Mina, PrivateKey, PublicKey, UInt64 } from "o1js";

class payoutInfo{
    amount:string;
    receiver:string;
    newIndex:string;
    }

export async function GameProof(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const name = request.query.get('name') || await request.text() || 'world';
    const datas = await request.json() as string;
    let result = "";
    if(name === "updateMerkle"){
       result = (await updateMerkle(datas)).toJSON();
    }
    else if(name == "payout"){
  result = (await payout(datas)).toJSON();
    }

    return { body: result };
};

const deployerAccount = PublicKey.fromBase58("");
const deployerKey = PrivateKey.fromBase58("");
const zkAppPrivateKey =PrivateKey.fromBase58("");

async function updateMerkle(jsonActions: string): Promise<Field>{
    const zkAppAddress =PublicKey.fromBase58("");
    
    const zkApp= new GameMerkle(zkAppAddress);

    const actualMerkle = zkApp.root.get();

    const buildMerkle = new BuildMerkle(actualMerkle);

    const actions: GameAction[] = JSON.parse(jsonActions);

    const result = buildMerkle.build(actions);

    const txn = await Mina.transaction(deployerAccount, () => {
      zkApp.updateMerkle(result.merkle, result.expected);
      zkApp.requireSignature();
    });
    await txn.prove();
    await txn.sign([deployerKey, zkAppPrivateKey]).send();

    const merkleRoot = await zkApp.root.get();
    return merkleRoot;
}



async function payout(jsonActions: string): Promise<Field>{
    const zkAppAddress =PublicKey.fromBase58("");
    
    const zkApp= new GameMerkle(zkAppAddress);
  
    const payoutInfo: payoutInfo = JSON.parse(jsonActions);   

    const txn = await Mina.transaction(deployerAccount, () => {
      zkApp.payout(UInt64.from(payoutInfo.amount),PublicKey.fromBase58(payoutInfo.receiver),Field.from(payoutInfo.newIndex));
      zkApp.requireSignature();
    });
    await txn.prove();
    await txn.sign([deployerKey, zkAppPrivateKey]).send();

    const merkleRoot = await zkApp.root.get();
    return merkleRoot;
}

app.http('GameProof', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: GameProof
});
