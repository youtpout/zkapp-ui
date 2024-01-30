import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { GameMerkle, GameAction, BuildMerkle } from '../../../contracts/src/gamemerkle';
import { Field, Mina, PrivateKey, PublicKey, UInt64, VerificationKey } from "o1js";

class payoutInfo{
    amount:string;
    receiver:string;
    newIndex:string;
    }

GameMerkle.compile();

const privateKeyApp = `${process.env["APP_PRIVATE_KEY"]}`;
const feePayerKey = `${process.env["PAYER_PRIVATE_KEY"]}`;

const deployerKey = PrivateKey.fromBase58(feePayerKey);
const deployerAccount = deployerKey.toPublicKey();
const zkAppPrivateKey =PrivateKey.fromBase58(privateKeyApp);
const zkAppAddress = zkAppPrivateKey.toPublicKey();

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
    else if(name == "upgrade"){
        result = (await upgrade(datas)).toJSON();
    }
    else if(name == "lastPayout"){
        result = (await lastPayout()).toJSON(); 
    }
    else if(name == "merkleRoot"){
        result = (await actualRoot()).toJSON(); 
    }
    else{
        throw new Error("Not found");
    }

    return { body: result };
};

async function updateMerkle(jsonActions: string): Promise<Field>{
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
    const zkApp= new GameMerkle(zkAppAddress);
  
    const payoutInfo: payoutInfo = JSON.parse(jsonActions);   

    const txn = await Mina.transaction(deployerAccount, () => {
      zkApp.payout(UInt64.from(payoutInfo.amount),PublicKey.fromBase58(payoutInfo.receiver),Field.from(payoutInfo.newIndex));
      zkApp.requireSignature();
    });
    await txn.prove();
    await txn.sign([deployerKey, zkAppPrivateKey]).send();

   
    return Field(1);
}


async function upgrade(jsonActions: string): Promise<Field>{
    
    const zkApp= new GameMerkle(zkAppAddress);

    const txn = await Mina.transaction(deployerAccount, () => {
      zkApp.upgrade(VerificationKey.fromJSON(jsonActions));
      zkApp.requireSignature();
    });
    await txn.prove();
    await txn.sign([deployerKey, zkAppPrivateKey]).send();

    return Field(1);
}


async function lastPayout(): Promise<Field>{
    
    const zkApp= new GameMerkle(zkAppAddress);

    return await zkApp.indexPayout.get();
}

async function actualRoot(): Promise<Field>{
    
    const zkApp= new GameMerkle(zkAppAddress);

    return await zkApp.root.get();
}

app.http('GameProof', {
    methods: ['POST', 'GET'],
    authLevel: 'anonymous',
    handler: GameProof
});
