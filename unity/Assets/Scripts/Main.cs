using MinaSignerNet.Utils;
using MinaSignerNet;
using Newtonsoft.Json;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEditor.U2D.Path.GUIFramework;
using UnityEngine;
using UnityEngine.UI;
using Assets.Scripts;

public class Main : MonoBehaviour
{
    public static bool IsPlayerOTurn = false;
    public static bool GameEnd = true;

    private long startGame = 0;

    private List<Tile> tiles = new List<Tile>();
    public GameObject gameOver;
    public Text lblGameOver;
    public Button btnSend;

    private string player1Key = string.Empty;
    private string player2Key = "EKFdQ8aJ6jDViUKhQcaUrUAXcTuixCyBSFayS8xx9vCG8puUyGPG";

    // Start is called before the first frame update
    void Start()
    {
        tiles = this.GetComponentsInChildren<Tile>().ToList();
        Debug.Log($"tiles nb {tiles.Count}");
        btnSend.gameObject.SetActive(false);
        InvokeRepeating("TimeOut", 1f, 1f);  //1s delay, repeat every 1s
    }


    public void NewGame()
    {
        GameEnd = false;
        IsPlayerOTurn = false;
        tiles.ForEach(x => x.Reset());
        gameOver.SetActive(false);
        btnSend.gameObject.SetActive(false);
        startGame = new DateTimeOffset(DateTime.UtcNow).ToUnixTimeSeconds();

        try
        {
            var account = MinaInteraction.GetAccount();
            Debug.Log("player account " + account);
            player1Key = account;
        }
        catch (Exception ex)
        {
            Debug.LogException(ex);
        }
    }

    // Update is called once per frame
    void Update()
    {
        if (GameEnd)
        {
            return;
        }
        EnumWinner winner = CheckWin();
        GameEnd = winner != EnumWinner.NotFinish;
        if (GameEnd)
        {
            switch (winner)
            {
                case EnumWinner.PlayerX:
                    lblGameOver.text = "You win";
                    btnSend.gameObject.SetActive(true);
                    break;
                case EnumWinner.PlayerO:
                    lblGameOver.text = "You loose";
                    break;
                default:
                    lblGameOver.text = "Draw";
                    break;
            }
            gameOver.SetActive(true);
        }
    }

    public void TimeOut()
    {

        if (!GameEnd && IsPlayerOTurn)
        {
            IAMove();
        }
    }

    public void IAMove()
    {
        // IA mechanism if mid tile doesn't selected check it by default
        if (tiles[4].TileState == EnumState.Unpressed)
        {
            tiles[4].IAClick();
        }
        else if (tiles.Where((x) => x.TileState == EnumState.PlayerX).Count() == 1)
        {
            // player X only check mid, check random position
            var tilesEmpty = tiles.Where((x) => x.TileState == EnumState.Unpressed).ToArray();
            var rand = new System.Random().Next(0, tilesEmpty.Length);
            tilesEmpty[rand].IAClick();
        }
        else
        {
            // try to block move from Player X
            if (tiles[0].TileState == EnumState.PlayerX)
            {
                if (tiles[1].TileState == EnumState.PlayerX)
                {
                    tiles[2].IAClick();
                }
                else if (tiles[2].TileState == EnumState.PlayerX)
                {
                    tiles[1].IAClick();
                }
                else if (tiles[4].TileState == EnumState.PlayerX)
                {
                    tiles[8].IAClick();
                }
                else if (tiles[8].TileState == EnumState.PlayerX)
                {
                    tiles[4].IAClick();
                }
                else if (tiles[3].TileState == EnumState.PlayerX)
                {
                    tiles[6].IAClick();
                }
                if (tiles[6].TileState == EnumState.PlayerX)
                {
                    tiles[3].IAClick();
                }
            }
            else if (tiles[1].TileState == EnumState.PlayerX)
            {
                if (tiles[2].TileState == EnumState.PlayerX)
                {
                    tiles[0].IAClick();
                }
                else if (tiles[4].TileState == EnumState.PlayerX)
                {
                    tiles[7].IAClick();
                }
                else if (tiles[7].TileState == EnumState.PlayerX)
                {
                    tiles[4].IAClick();
                }
            }
            else if (tiles[2].TileState == EnumState.PlayerX)
            {
                if (tiles[4].TileState == EnumState.PlayerX)
                {
                    tiles[6].IAClick();
                }
                else if (tiles[6].TileState == EnumState.PlayerX)
                {
                    tiles[4].IAClick();
                }
                else if (tiles[5].TileState == EnumState.PlayerX)
                {
                    tiles[8].IAClick();
                }
                else if (tiles[8].TileState == EnumState.PlayerX)
                {
                    tiles[5].IAClick();
                }
            }
            else if (tiles[3].TileState == EnumState.PlayerX)
            {
                if (tiles[4].TileState == EnumState.PlayerX)
                {
                    tiles[5].IAClick();
                }
            }
            else if (tiles[6].TileState == EnumState.PlayerX)
            {
                if (tiles[7].TileState == EnumState.PlayerX)
                {
                    tiles[8].IAClick();
                }
                else if (tiles[8].TileState == EnumState.PlayerX)
                {
                    tiles[7].IAClick();
                }
            }

            if (IsPlayerOTurn)
            {
                // if we check nothing and it IA turn use random check
                var tilesEmpty = tiles.Where((x) => x.TileState == EnumState.Unpressed).ToArray();
                var rand = new System.Random().Next(0, tilesEmpty.Length);
                tilesEmpty[rand].IAClick();
            }
        }
    }

    public EnumWinner CheckWin()
    {

        var horizontal1 = GetWinner((x, i) => i < 3);
        if (horizontal1 != EnumWinner.NotFinish)
        {
            return horizontal1;
        }
        var horizontal2 = GetWinner((x, i) => i > 2 && i < 6);
        if (horizontal2 != EnumWinner.NotFinish)
        {
            return horizontal2;
        }
        var horizontal3 = GetWinner((x, i) => i > 5);
        if (horizontal3 != EnumWinner.NotFinish)
        {
            return horizontal3;
        }

        var vertical1 = GetWinner((x, i) => i % 3 == 0);
        if (vertical1 != EnumWinner.NotFinish)
        {
            return vertical1;
        }
        var vertical2 = GetWinner((x, i) => (i - 1) % 3 == 0);
        if (vertical2 != EnumWinner.NotFinish)
        {
            return vertical2;
        }
        var vertical3 = GetWinner((x, i) => (i - 2) % 3 == 0);
        if (vertical3 != EnumWinner.NotFinish)
        {
            return vertical3;
        }

        var cross1 = GetWinner((x, i) => i % 4 == 0);
        if (cross1 != EnumWinner.NotFinish)
        {
            return cross1;
        }

        var cross2 = GetWinner((x, i) => i == 2 || i == 4 || i == 6);
        if (cross2 != EnumWinner.NotFinish)
        {
            return cross2;
        }


        bool notFinish = tiles.Any(x => x.TileState == EnumState.Unpressed);
        return notFinish ? EnumWinner.NotFinish : EnumWinner.Draw;
    }

    private EnumWinner GetWinner(Func<Tile, int, bool> checkPredicate)
    {
        var result = tiles.Where((x, i) => checkPredicate(x, i)).Select(x => x.TileState).Distinct().ToList();
        var first = result.First();
        if (result.Count == 1 && first != EnumState.Unpressed)
        {
            return first == EnumState.PlayerO ? EnumWinner.PlayerO : EnumWinner.PlayerX;
        }
        return EnumWinner.NotFinish;
    }

    public void Send()
    {
        try
        {
            List<bool> isPlayed = new List<bool>();
            List<bool> player = new List<bool>();
            for (var i = 0; i < 3; i++)
            {
                for (var j = 0; j < 3; j++)
                {
                    int index = i + (j * 3);
                    bool played = this.tiles[index].TileState != EnumState.Unpressed;
                    bool isPlayer2 = this.tiles[index].TileState == EnumState.PlayerO;
                    isPlayed.Add(played);
                    player.Add(isPlayer2);
                }
            }

            // serialize field like board game
            var bytes = isPlayed.Concat(player).ToList().BitsToBytes().BytesToBigInt();

            var privKey = new PrivateKey(player2Key);
            GameState state = new GameState()
            {
                Player1 = new PublicKey(player1Key),
                Player2 = privKey.GetPublicKey(),
                // todo use the real board number
                Board = bytes,
                NextIsPlayer2 = IsPlayerOTurn,
                StartTimeStamp = (ulong)startGame
            };
            var hash = state.Hash();
            Debug.Log(hash);

            var signature = Signature.Sign(hash, player2Key, MinaSignerNet.Network.Testnet);
            //    var tictactoe = JavaScript.GetInterface("tictactoe");

            //    string stateJson = JsonConvert.SerializeObject(state);
            // var account = tictactoe.DynamicObject.send(stateJson, signature.ToString(), hash.ToString());
        }
        catch (Exception ex)
        {
            Debug.LogException(ex);
        }


    }

}
