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
} from 'o1js';

export { Board, GameState, TicTacProgram, TicTacProof, WinToken };

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

class GameState extends Struct({
  player1: PublicKey,
  player2: PublicKey,
  gameDone: Bool,
  board: Field,
  nextIsPlayer2: Bool,
}) {}

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

const TicTacProgram = ZkProgram({
  name: 'TicTacToe Proof',
  // all infos are store in game state
  publicOutput: GameState,

  methods: {
    init: {
      privateInputs: [],
      method(): GameState {
        return {
          board: Field(0),
          player1: PublicKey.empty(),
          player2: PublicKey.empty(),
          gameDone: Bool(false),
          nextIsPlayer2: Bool(false),
        };
      },
    },

    startGame: {
      privateInputs: [PublicKey, PublicKey],
      method(player1: PublicKey, player2: PublicKey): GameState {
        return {
          board: Field(0),
          player1,
          player2,
          gameDone: Bool(false),
          nextIsPlayer2: Bool(false),
        };
      },
    },

    play: {
      privateInputs: [PublicKey, Signature, Field, Field, SelfProof],
      method(
        pubkey: PublicKey,
        signature: Signature,
        x: Field,
        y: Field,
        earlierProof: SelfProof<void, GameState>
      ): GameState {
        // verify everything is correct
        earlierProof.verify();

        let input = earlierProof.publicOutput;

        // 1. if the game is already finished, abort.
        input.gameDone.assertEquals(Bool(false)); // precondition on this.gameDone

        // 2. ensure that we know the private key associated to the public key
        //    and that our public key is known to the zkApp

        // ensure player owns the associated private key
        signature.verify(pubkey, [x, y]).assertTrue();

        // ensure player is valid
        const player1 = input.player1;
        const player2 = input.player2;
        Bool.or(pubkey.equals(player1), pubkey.equals(player2)).assertTrue();

        // 3. Make sure that its our turn,
        //    and set the state for the next player

        // get player token
        const player = pubkey.equals(player2); // player 1 is false, player 2 is true

        // ensure its their turn
        const nextPlayer = input.nextIsPlayer2;
        nextPlayer.assertEquals(player);

        // set the next player
        input.nextIsPlayer2 = player.not();

        // 4. get and deserialize the board
        let board = new Board(input.board);

        // 5. update the board (and the state) with our move
        x.equals(Field(0))
          .or(x.equals(Field(1)))
          .or(x.equals(Field(2)))
          .assertTrue();
        y.equals(Field(0))
          .or(y.equals(Field(1)))
          .or(y.equals(Field(2)))
          .assertTrue();

        board.update(x, y, player);
        input.board = board.serialize();

        // 6. did I just win? If so, update the state as well
        const won = board.checkWinner();
        input.gameDone = won;

        return input;
      },
    },
  },
});

let TicTacProof_ = ZkProgram.Proof(TicTacProgram);
class TicTacProof extends TicTacProof_ {}

const tokenSymbol = 'WINTTT';
const mintAmount = 1;
class WinToken extends SmartContract {
  @state(UInt64) totalAmountInCirculation = State<UInt64>();

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

  // can only mint for winner
  @method mint(receiverAddress: PublicKey, proof: TicTacProof) {
    let account = Account(receiverAddress, this.token.id);
    let balance = account.balance.getAndAssertEquals();

    balance.assertLessThan(UInt64.from(1), 'Already a win token');

    proof.verify();

    // check if it's a winner proof
    proof.publicOutput.gameDone.assertEquals(Bool(true));

    // if next is player2 so player1 win
    const winner = Provable.if<PublicKey>(
      proof.publicOutput.nextIsPlayer2,
      proof.publicOutput.player1,
      proof.publicOutput.player2
    );

    // check you are the winner
    winner.assertEquals(receiverAddress);

    this.token.mint({
      address: receiverAddress,
      amount: mintAmount,
    });

    const totalAmountInCirculation =
      this.totalAmountInCirculation.getAndAssertEquals();
    let newTotalAmountInCirculation = totalAmountInCirculation.add(mintAmount);
    this.totalAmountInCirculation.set(newTotalAmountInCirculation);
  }
}
