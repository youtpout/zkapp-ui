"use strict";
(self["webpackChunk_N_E"] = self["webpackChunk_N_E"] || []).push([[270],{

/***/ 3270:
/***/ (function(__webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.a(__webpack_module__, async function (__webpack_handle_async_dependencies__, __webpack_async_result__) { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Board": function() { return /* binding */ Board; },
/* harmony export */   "GameState": function() { return /* binding */ GameState; },
/* harmony export */   "SaveToken": function() { return /* binding */ SaveToken; },
/* harmony export */   "WinToken": function() { return /* binding */ WinToken; }
/* harmony export */ });
/* harmony import */ var o1js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(9466);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([o1js__WEBPACK_IMPORTED_MODULE_0__]);
o1js__WEBPACK_IMPORTED_MODULE_0__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];
/**
 * This file defines the `TicTacToe` smart contract and the helpers it needs.
 */
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


function Optional(type) {
    return class Optional_ extends (0,o1js__WEBPACK_IMPORTED_MODULE_0__/* .Struct */ .AU)({ isSome: o1js__WEBPACK_IMPORTED_MODULE_0__/* .Bool */ .tW, value: type }) {
        constructor(isSome, value) {
            super({ isSome: (0,o1js__WEBPACK_IMPORTED_MODULE_0__/* .Bool */ .tW)(isSome), value });
        }
        toFields() {
            return Optional_.toFields(this);
        }
    };
}
class OptionalBool extends Optional(o1js__WEBPACK_IMPORTED_MODULE_0__/* .Bool */ .tW) {
}
class Board {
    constructor(serializedBoard) {
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
    serialize() {
        let isPlayed = [];
        let player = [];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                isPlayed.push(this.board[i][j].isSome);
                player.push(this.board[i][j].value);
            }
        }
        return o1js__WEBPACK_IMPORTED_MODULE_0__/* .Field.fromBits */ .gN.fromBits(isPlayed.concat(player));
    }
    update(x, y, playerToken) {
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                // is this the cell the player wants to play?
                const toUpdate = x.equals(new o1js__WEBPACK_IMPORTED_MODULE_0__/* .Field */ .gN(i)).and(y.equals(new o1js__WEBPACK_IMPORTED_MODULE_0__/* .Field */ .gN(j)));
                // make sure we can play there
                toUpdate.and(this.board[i][j].isSome).assertEquals(false);
                // copy the board (or update if this is the cell the player wants to play)
                this.board[i][j] = o1js__WEBPACK_IMPORTED_MODULE_0__/* .Provable["if"] */ .PC["if"](toUpdate, new OptionalBool(true, playerToken), this.board[i][j]);
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
    checkWinner() {
        let won = new o1js__WEBPACK_IMPORTED_MODULE_0__/* .Bool */ .tW(false);
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
class GameState extends (0,o1js__WEBPACK_IMPORTED_MODULE_0__/* .Struct */ .AU)({
    player1: o1js__WEBPACK_IMPORTED_MODULE_0__/* .PublicKey */ .nh,
    player2: o1js__WEBPACK_IMPORTED_MODULE_0__/* .PublicKey */ .nh,
    board: o1js__WEBPACK_IMPORTED_MODULE_0__/* .Field */ .gN,
    nextIsPlayer2: o1js__WEBPACK_IMPORTED_MODULE_0__/* .Bool */ .tW,
    startTimeStamp: o1js__WEBPACK_IMPORTED_MODULE_0__/* .UInt64 */ .zM,
}) {
    constructor(value) {
        super(value);
    }
    hash() {
        return o1js__WEBPACK_IMPORTED_MODULE_0__/* .Poseidon.hash */ .jm.hash([
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
class WinToken extends o1js__WEBPACK_IMPORTED_MODULE_0__/* .SmartContract */ .C3 {
    constructor() {
        super(...arguments);
        this.totalAmountInCirculation = (0,o1js__WEBPACK_IMPORTED_MODULE_0__/* .State */ .ZM)();
        this.saveTokenAddress = (0,o1js__WEBPACK_IMPORTED_MODULE_0__/* .State */ .ZM)();
    }
    deploy(args) {
        super.deploy(args);
        const permissionToEdit = o1js__WEBPACK_IMPORTED_MODULE_0__/* .Permissions.proof */ .Pl.proof();
        this.account.permissions.set({
            ...o1js__WEBPACK_IMPORTED_MODULE_0__/* .Permissions["default"] */ .Pl["default"](),
            editState: permissionToEdit,
            setTokenSymbol: permissionToEdit,
            send: permissionToEdit,
            receive: permissionToEdit,
        });
    }
    init() {
        super.init();
        this.account.tokenSymbol.set(tokenSymbol);
        this.totalAmountInCirculation.set(o1js__WEBPACK_IMPORTED_MODULE_0__/* .UInt64.zero */ .zM.zero);
    }
    setSaveContractAddress(signature, sAddress) {
        // only zkapp can update it
        const owner = this.token.tokenOwner;
        signature.verify(owner, sAddress.toFields()).assertTrue('Invalid Signer');
        this.saveTokenAddress.set(sAddress);
    }
    // can only mint for winner
    mint(receiverAddress) {
        this.token.mint({
            address: receiverAddress,
            amount: mintAmount,
        });
        const totalAmountInCirculation = this.totalAmountInCirculation.getAndAssertEquals();
        let newTotalAmountInCirculation = totalAmountInCirculation.add(mintAmount);
        this.totalAmountInCirculation.set(newTotalAmountInCirculation);
    }
    getReward(pubkey1, signature1, pubkey2, signature2, gameState) {
        // ensure player sign this game
        signature1.verify(pubkey1, [gameState.hash()]).assertTrue();
        signature2.verify(pubkey2, [gameState.hash()]).assertTrue();
        // ensure player is valid
        const player1 = gameState.player1;
        const player2 = gameState.player2;
        o1js__WEBPACK_IMPORTED_MODULE_0__/* .Bool.or */ .tW.or(pubkey1.equals(player1), pubkey2.equals(player2)).assertTrue();
        pubkey1.equals(pubkey2).assertFalse();
        let board = new Board(gameState.board);
        // did someone just win? If so, mont token for him
        const won = board.checkWinner();
        won.assertTrue();
        const winner = o1js__WEBPACK_IMPORTED_MODULE_0__/* .Provable["if"] */ .PC["if"](gameState.nextIsPlayer2, gameState.player1, gameState.player2);
        const signature = o1js__WEBPACK_IMPORTED_MODULE_0__/* .Provable["if"] */ .PC["if"](gameState.nextIsPlayer2, signature1, signature2);
        const address = this.saveTokenAddress.getAndAssertEquals();
        const saveContract = new SaveToken(address);
        saveContract.update(winner, signature, gameState);
        this.mint(winner);
    }
}
__decorate([
    (0,o1js__WEBPACK_IMPORTED_MODULE_0__/* .state */ .SB)(o1js__WEBPACK_IMPORTED_MODULE_0__/* .UInt64 */ .zM),
    __metadata("design:type", Object)
], WinToken.prototype, "totalAmountInCirculation", void 0);
__decorate([
    (0,o1js__WEBPACK_IMPORTED_MODULE_0__/* .state */ .SB)(o1js__WEBPACK_IMPORTED_MODULE_0__/* .PublicKey */ .nh),
    __metadata("design:type", Object)
], WinToken.prototype, "saveTokenAddress", void 0);
__decorate([
    o1js__WEBPACK_IMPORTED_MODULE_0__/* .method */ .UD,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WinToken.prototype, "init", null);
__decorate([
    o1js__WEBPACK_IMPORTED_MODULE_0__/* .method */ .UD,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [o1js__WEBPACK_IMPORTED_MODULE_0__/* .Signature */ .Pc, o1js__WEBPACK_IMPORTED_MODULE_0__/* .PublicKey */ .nh]),
    __metadata("design:returntype", void 0)
], WinToken.prototype, "setSaveContractAddress", null);
__decorate([
    o1js__WEBPACK_IMPORTED_MODULE_0__/* .method */ .UD,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [o1js__WEBPACK_IMPORTED_MODULE_0__/* .PublicKey */ .nh,
        o1js__WEBPACK_IMPORTED_MODULE_0__/* .Signature */ .Pc,
        o1js__WEBPACK_IMPORTED_MODULE_0__/* .PublicKey */ .nh,
        o1js__WEBPACK_IMPORTED_MODULE_0__/* .Signature */ .Pc,
        GameState]),
    __metadata("design:returntype", void 0)
], WinToken.prototype, "getReward", null);
const saveToken = 'Save';
class SaveToken extends o1js__WEBPACK_IMPORTED_MODULE_0__/* .SmartContract */ .C3 {
    constructor() {
        super(...arguments);
        this.adminAddress = (0,o1js__WEBPACK_IMPORTED_MODULE_0__/* .State */ .ZM)();
    }
    deploy(args) {
        super.deploy(args);
        const permissionToEdit = o1js__WEBPACK_IMPORTED_MODULE_0__/* .Permissions.proof */ .Pl.proof();
        this.account.permissions.set({
            ...o1js__WEBPACK_IMPORTED_MODULE_0__/* .Permissions["default"] */ .Pl["default"](),
            editState: permissionToEdit,
            setTokenSymbol: permissionToEdit,
            send: permissionToEdit,
            receive: permissionToEdit,
        });
    }
    init() {
        super.init();
        this.account.tokenSymbol.set(saveToken);
    }
    // we use this method to check if an user don't reuse past timestamp
    // we store timestamp as an amount
    update(player, signature, gameState) {
        // check signature to update for the player
        signature.verify(player, [gameState.hash()]).assertTrue();
        let account = (0,o1js__WEBPACK_IMPORTED_MODULE_0__/* .Account */ .mR)(player, this.token.id);
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
__decorate([
    (0,o1js__WEBPACK_IMPORTED_MODULE_0__/* .state */ .SB)(o1js__WEBPACK_IMPORTED_MODULE_0__/* .PublicKey */ .nh),
    __metadata("design:type", Object)
], SaveToken.prototype, "adminAddress", void 0);
__decorate([
    o1js__WEBPACK_IMPORTED_MODULE_0__/* .method */ .UD,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SaveToken.prototype, "init", null);
__decorate([
    o1js__WEBPACK_IMPORTED_MODULE_0__/* .method */ .UD,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [o1js__WEBPACK_IMPORTED_MODULE_0__/* .PublicKey */ .nh,
        o1js__WEBPACK_IMPORTED_MODULE_0__/* .Signature */ .Pc,
        GameState]),
    __metadata("design:returntype", void 0)
], SaveToken.prototype, "update", null);
//# sourceMappingURL=tictacsign.js.map
__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ })

}]);