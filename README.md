# Mina zkApp: Tictacsign

Updated version of template Tictactoe to create smartcontract who need only signature of 2 players for validate the game and generate a wintoken for the winner.

The goal is to create a game with godot and use player 2 as IA, once the game is done you can send a transaction and get a WinToken if your win the game.


## Contracts

Source code of smartcontracts deployed on Barkeley

## UI

Source of webpage who host the game and implement zkworker

To update the Game in the UI, just export the game as HTML5 in Godot and copy the 3 files GodotMina.js/GodotMina.pck/GodotMina.wasm in ui/public folder, accept to replace the old files

## Godot

Source of tictactoe game create with Godot 3.5 in C#

Player 2 is an AI, and if you win he'll create a signature you need to create proof of your victory on the mina blockchain. 

## UI Unity

Source of webpage who host the game and implement zkworker

To update the Game in the UI, just export the game as HTML5 in Unity and copy the files except index.html in ui-unity/public folder, accept to replace the old files

## Unity

Source of tictactoe game create with Unity 2021.3.13f1

Player 2 is an AI, and if you win he'll create a signature you need to create proof of your victory on the mina blockchain. 


[Assets from DCR Gaming](https://dcr-gaming.itch.io/tictactoeassets)

[C# Library used to sign in Godot/Unity](https://github.com/youtpout/MinaSignerNet)

[Godot game version](https://youtpout.github.io/TicTacToe/)

[Unity game version](https://youtpout.github.io/tictactoe-unity/)


## Deploy to github page

Replace github page directory name in these 3 files : reactCOIServiceWorker.tsx, ghp-postbuild.mjs, next.config.js

build your version with ```yarn run deploy``` or ```npm run deploy```

push the files in out folder in your github page repository

## How it's work

The smartcontract created with o1js are in the /contracts folder, they are imported in respective /ui folders (one for unity and another for godot), the ui template was duplicated from mina example.

The game was created with godot game engine and unity game engine.

To interact with JS from godot you need to use Javascript object (Check Main.cs in godot folder)

[Godot Javascript docs](https://docs.godotengine.org/en/3.5/classes/class_javascript.html)

To interact with JS from unity you need to create a jslib file and a class who import method from this file (check MinaInteraction files from Unity Assets folder)

[Unity Javascript docs](https://docs.unity3d.com/Manual/webgl-interactingwithbrowserscripting.html)

You need to export the build from these games and copy it in respective public folder in ui

I choose to initialize the game once the smartcontract are loaded and compiled, but you can choose an other method

The code to load game engine are split between _app.page.tsx and index.page.tsx

I choose to store essential information from smartcontract in js object window.tictactoe, it's a good method to interact between react app and the game

