# Mina zkApp: Tictacsign

Updated version of template Tictactoe to create smartcontract who need only signature of 2 players for validate the game and generate a wintoken for the winner.

The goal is to create a game with godot and use player 2 as IA.


## How to build

```sh
npm run build
```

## How to run in local

```sh
npm run start
```

## How to run tests

```sh
npm run test
npm run testw # watch mode
```

## How to run coverage

```sh
npm run coverage
```

## How to deploy 
Use zk config 

Create 2 alias and deploy Wintoken with the first alias and SaveToken with the second alias 

Update the file src/update.ts with the information of these smartcontract to call setSaveContractAddress

```
npm run build
npm run update
```

Your smartcontract is ready to consume

## Addresses
[WinToken](https://minascan.io/berkeley/account/B62qrMWbGSH5Lky7P6c9Wre23xBBTRJUG6TNpZrLQVqJdW4m5uaHHdC/zkApp?type=zk-acc)

[SaveToken](https://minascan.io/berkeley/account/B62qkR9Har8apahum18KggGtHbAiumoQ65b6uH4vukaqdh3LZCA9jt5/zkApp?type=zk-acc)

## License

[Apache-2.0](LICENSE)
