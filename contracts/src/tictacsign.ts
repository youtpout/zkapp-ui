/**
 * This file defines the `TicTacToe` smart contract and the helpers it needs.
 */

import {
  Field,
  PublicKey,
  Bool,
  Provable,
  Signature,
  Struct,
  SelfProof,
  ZkProgram,
  SmartContract,
  state,
  Account,
  DeployArgs,
  State,
  UInt64,
  method,
  Permissions,
  Poseidon,
} from 'o1js';
import { Authorization } from 'o1js/dist/node/lib/account_update';

import { sign } from 'o1js/dist/node/mina-signer/src/signature';

export { Board, GameState, WinToken, SaveToken };

function Optional<T>(type: Provable<T>) {
  return class Optional_ extends Struct({ isSome: Bool, value: type }) {
    constructor(isSome: boolean | Bool, value: T) {
      super({ isSome: Bool(isSome), value });
    }

    toFields() {
      return Optional_.toFields(this);
    }
  };
}

class OptionalBool extends Optional(Bool) {}

class Board {
  board: OptionalBool[][];

  constructor(serializedBoard: Field) {
    const bits = serializedBoard.toBits(18);
    let board = [];
    for (let i = 0; i < 3; i++) {
      let row = [];
      for (let j = 0; j < 3; j++) {
        const isPlayed = bits[i * 3 + j];
        const player = bits[i * 3 + j + 9];
        row.push(new OptionalBool(isPlayed, player));
      }
      board.push(row);
    }
    this.board = board;
  }

  serialize(): Field {
    let isPlayed = [];
    let player = [];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        isPlayed.push(this.board[i][j].isSome);
        player.push(this.board[i][j].value);
      }
    }
    return Field.fromBits(isPlayed.concat(player));
  }

  update(x: Field, y: Field, playerToken: Bool) {
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        // is this the cell the player wants to play?
        const toUpdate = x.equals(new Field(i)).and(y.equals(new Field(j)));

        // make sure we can play there
        toUpdate.and(this.board[i][j].isSome).assertEquals(false);

        // copy the board (or update if this is the cell the player wants to play)
        this.board[i][j] = Provable.if(
          toUpdate,
          new OptionalBool(true, playerToken),
          this.board[i][j]
        );
      }
    }
  }

  printState() {
    for (let i = 0; i < 3; i++) {
      let row = '| ';
      for (let j = 0; j < 3; j++) {
        let token = '_';
        if (this.board[i][j].isSome.toBoolean()) {
          token = this.board[i][j].value.toBoolean() ? 'X' : 'O';
        }

        row += token + ' | ';
      }
      console.log(row);
    }
    console.log('---\n');
  }

  checkWinner(): Bool {
    let won = new Bool(false);

    // check rows
    for (let i = 0; i < 3; i++) {
      let row = this.board[i][0].isSome;
      row = row.and(this.board[i][1].isSome);
      row = row.and(this.board[i][2].isSome);
      row = row.and(this.board[i][0].value.equals(this.board[i][1].value));
      row = row.and(this.board[i][1].value.equals(this.board[i][2].value));
      won = won.or(row);
    }

    // check cols
    for (let i = 0; i < 3; i++) {
      let col = this.board[0][i].isSome;
      col = col.and(this.board[1][i].isSome);
      col = col.and(this.board[2][i].isSome);
      col = col.and(this.board[0][i].value.equals(this.board[1][i].value));
      col = col.and(this.board[1][i].value.equals(this.board[2][i].value));
      won = won.or(col);
    }

    // check diagonals
    let diag1 = this.board[0][0].isSome;
    diag1 = diag1.and(this.board[1][1].isSome);
    diag1 = diag1.and(this.board[2][2].isSome);
    diag1 = diag1.and(this.board[0][0].value.equals(this.board[1][1].value));
    diag1 = diag1.and(this.board[1][1].value.equals(this.board[2][2].value));
    won = won.or(diag1);

    let diag2 = this.board[0][2].isSome;
    diag2 = diag2.and(this.board[1][1].isSome);
    diag2 = diag2.and(this.board[0][2].isSome);
    diag2 = diag2.and(this.board[0][2].value.equals(this.board[1][1].value));
    diag2 = diag2.and(this.board[1][1].value.equals(this.board[2][0].value));
    won = won.or(diag2);

    //
    return won;
  }
}

class GameState extends Struct({
  player1: PublicKey,
  player2: PublicKey,
  board: Field,
  nextIsPlayer2: Bool,
  startTimeStamp: UInt64,
}) {
  constructor(value: {
    player1: PublicKey;
    player2: PublicKey;
    board: Field;
    nextIsPlayer2: Bool;
    startTimeStamp: UInt64;
  }) {
    super(value);
  }

  hash(): Field {
    return Poseidon.hash([
      this.player1.x,
      this.player1.isOdd.toField(),
      this.player2.x,
      this.player2.isOdd.toField(),
      this.board,
      this.nextIsPlayer2.toField(),
      this.startTimeStamp.value,
    ]);
  }
}

const tokenSymbol = 'WINTTT';
const mintAmount = 1;
class WinToken extends SmartContract {
  @state(UInt64) totalAmountInCirculation = State<UInt64>();
  @state(PublicKey) saveTokenAddress = State<PublicKey>();

  deploy(args: DeployArgs) {
    super.deploy(args);

    const permissionToEdit = Permissions.proof();

    this.account.permissions.set({
      ...Permissions.default(),
      editState: permissionToEdit,
      setTokenSymbol: permissionToEdit,
      send: permissionToEdit,
      receive: permissionToEdit,
    });
  }
  @method init() {
    super.init();
    this.account.tokenSymbol.set(tokenSymbol);
    this.totalAmountInCirculation.set(UInt64.zero);
  }

  @method setSaveContractAddress(signature: Signature, sAddress: PublicKey) {
    // only zkapp can update it
    const owner = this.token.tokenOwner;
    signature.verify(owner, sAddress.toFields()).assertTrue('Invalid Signer');

    this.saveTokenAddress.set(sAddress);
  }

  // can only mint for winner
  private mint(receiverAddress: PublicKey) {
    this.token.mint({
      address: receiverAddress,
      amount: mintAmount,
    });

    const totalAmountInCirculation =
      this.totalAmountInCirculation.getAndAssertEquals();
    let newTotalAmountInCirculation = totalAmountInCirculation.add(mintAmount);
    this.totalAmountInCirculation.set(newTotalAmountInCirculation);
  }

  @method getReward(
    pubkey1: PublicKey,
    signature1: Signature,
    pubkey2: PublicKey,
    signature2: Signature,
    gameState: GameState
  ): void {
    // ensure player sign this game
    signature1.verify(pubkey1, [gameState.hash()]).assertTrue();
    signature2.verify(pubkey2, [gameState.hash()]).assertTrue();

    // ensure player is valid
    const player1 = gameState.player1;
    const player2 = gameState.player2;
    Bool.or(pubkey1.equals(player1), pubkey2.equals(player2)).assertTrue();
    pubkey1.equals(pubkey2).assertFalse();

    let board = new Board(gameState.board);
    // did someone just win? If so, mont token for him
    const won = board.checkWinner();
    won.assertTrue();

    const winner = Provable.if<PublicKey>(
      gameState.nextIsPlayer2,
      gameState.player1,
      gameState.player2
    );

    const signature = Provable.if<Signature>(
      gameState.nextIsPlayer2,
      signature1,
      signature2
    );

    const address = this.saveTokenAddress.getAndAssertEquals();
    const saveContract = new SaveToken(address);
    saveContract.update(winner, signature, gameState);
    this.mint(winner);
  }
}

const saveToken = 'Save';
class SaveToken extends SmartContract {
  @state(PublicKey) adminAddress = State<PublicKey>();

  deploy(args: DeployArgs) {
    super.deploy(args);

    const permissionToEdit = Permissions.proof();

    this.account.permissions.set({
      ...Permissions.default(),
      editState: permissionToEdit,
      setTokenSymbol: permissionToEdit,
      send: permissionToEdit,
      receive: permissionToEdit,
    });
  }

  @method init() {
    super.init();
    this.account.tokenSymbol.set(saveToken);
  }

  // we use this method to check if an user don't reuse past timestamp
  // we store timestamp as an amount
  @method update(
    player: PublicKey,
    signature: Signature,
    gameState: GameState
  ) {
    // check signature to update for the player
    signature.verify(player, [gameState.hash()]).assertTrue();

    let account = Account(player, this.token.id);
    let balance = account.balance.getAndAssertEquals();

    let amount = gameState.startTimeStamp;

    // we can only mint if they are less token in the bag
    balance.assertLessThan(amount);

    const mintAmount = amount.sub(balance);

    this.token.mint({
      address: player,
      amount: mintAmount,
    });
  }
}
