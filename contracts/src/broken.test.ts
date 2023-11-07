import {
  AccountUpdate,
  Bool,
  Experimental,
  Mina,
  PrivateKey,
  PublicKey,
  SmartContract,
  State,
  UInt64,
  ZkProgram,
  method,
  state,
} from 'o1js';

export const RealProof = ZkProgram({
  name: 'broken',
  methods: {
    make: {
      privateInputs: [UInt64],

      method(val: UInt64) {
        val.assertEquals(UInt64.from(34));
      },
    },
  },
});

export const FakeProof = ZkProgram({
  name: 'broken',
  methods: {
    make: {
      privateInputs: [UInt64],

      method(value: UInt64) {
        Bool(true).assertTrue();
      },
    },
  },
});

class BrokenProof extends ZkProgram.Proof(RealProof) {}
class Broken extends SmartContract {
  @state(Bool) isValid = State<Bool>();

  init() {
    super.init();
    this.isValid.set(Bool(false));
  }

  @method setValid(proof: BrokenProof) {
    proof.verify();
    this.isValid.set(Bool(true));
  }
}

describe('Broken', () => {
  let deployerAccount: PublicKey;
  let deployerKey: PrivateKey;
  let senderAccount: PublicKey;
  let senderKey: PrivateKey;
  let zkAppAddress: PublicKey;
  let zkAppPrivateKey: PrivateKey;
  let zkApp: Broken;

  beforeAll(async () => {
    await RealProof.compile();
    await FakeProof.compile();
    await Broken.compile();
  });

  beforeEach(() => {
    const Local = Mina.LocalBlockchain({ proofsEnabled: true });
    Mina.setActiveInstance(Local);
    ({ privateKey: deployerKey, publicKey: deployerAccount } =
      Local.testAccounts[0]);
    ({ privateKey: senderKey, publicKey: senderAccount } =
      Local.testAccounts[1]);
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new Broken(zkAppAddress);
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      zkApp.deploy();
    });
    await txn.prove();
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  it('accepts a fake proof', async () => {
    await localDeploy();

    const value = UInt64.from(99999);
    const fakeProof = await RealProof.make(value);

    const txn = await Mina.transaction(senderAccount, () => {
      zkApp.setValid(fakeProof);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const isValid = zkApp.isValid.get();
    expect(isValid).toEqual(Bool(true));
  });
});
