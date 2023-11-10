using Godot;
using GodotMina;
using System;


public class Tile : TextureButton
{


    public readonly Texture Unpressed = ResourceLoader.Load<Texture>("res://assets/unpressed-tile.png");
    public readonly Texture PlayerX = ResourceLoader.Load<Texture>("res://assets/player-x-tile.png");
    public readonly Texture PlayerO = ResourceLoader.Load<Texture>("res://assets/player-o-tile.png");


    public EnumState TileState { get; set; }

    // Called when the node enters the scene tree for the first time.
    public override void _Ready()
    {
        this.TextureNormal = Unpressed;
    }

    public void OnClick()
    {
        if (TileState != EnumState.Unpressed || Main.GameEnd)
        {
            return;
        }

        if (Main.IsPlayerOTurn)
        {
            this.TextureNormal = PlayerO;
            TileState = EnumState.PlayerO;
        }
        else
        {
            this.TextureNormal = PlayerX;
            TileState = EnumState.PlayerX;
        }
        Main.IsPlayerOTurn = !Main.IsPlayerOTurn;
    }

    public void Reset()
    {
        TileState = EnumState.Unpressed;
        this.TextureNormal = Unpressed;
    }

    //  // Called every frame. 'delta' is the elapsed time since the previous frame.
    //  public override void _Process(float delta)
    //  {
    //      
    //  }
}
