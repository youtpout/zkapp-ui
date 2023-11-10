using Godot;
using GodotMina;
using System;
using System.Collections.Generic;
using System.Linq;

public class Main : Control
{
    public static bool IsPlayerOTurn = false;
    public static bool GameEnd = true;

    private List<Tile> tiles = new List<Tile>();
    private Control gameOver;
    private Label lblGameOver;
    private Button btnGameOver;
    // Declare member variables here. Examples:
    // private int a = 2;
    // private string b = "text";

    // Called when the node enters the scene tree for the first time.
    public override void _Ready()
    {
        gameOver = GetNode<Control>("GameOver");
        lblGameOver = gameOver.GetNode<Label>("VBoxContainer/Label");
        btnGameOver = gameOver.GetNode<Button>("VBoxContainer/Button");

        for (int i = 0; i < 9; i++)
        {
            var tile = GetNode<Tile>($"Board/Row{i / 3}/Tile{i}");
            tiles.Add(tile);
        }
        GD.Print("size " + tiles.Count);
    }

    // Called every frame. 'delta' is the elapsed time since the previous frame.
    public override void _Process(float delta)
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
                    lblGameOver.Text = "You win";
                    break;
                case EnumWinner.PlayerO:
                    lblGameOver.Text = "You loose";
                    break;
                default:
                    lblGameOver.Text = "Draw";
                    break;
            }
            gameOver.Show();
        }
    }

    public void NewGame()
    {
        GameEnd = false;
        IsPlayerOTurn = false;
        tiles.ForEach(x => x.Reset());
        gameOver.Hide();
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
}
