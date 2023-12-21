using System.Collections;
using System.Collections.Generic;
using System.Resources;
using UnityEngine;
using static UnityEditor.Experimental.GraphView.GraphView;

public class Tile : MonoBehaviour
{
    public EnumState TileState { get; set; }

    public readonly Texture Unpressed;
    public readonly Texture PlayerX; 
    public readonly Texture PlayerO;

    // Start is called before the first frame update
    void Start()
    {

    }

    // Update is called once per frame
    void Update()
    {

    }

    public void OnClick()
    {
        if (TileState != EnumState.Unpressed || Main.GameEnd)
        {
            return;
        }

        if (Main.IsPlayerOTurn)
        {
            return;
        }
        else
        {
           // this.TextureNormal = PlayerX;
            TileState = EnumState.PlayerX;
        }
        Main.IsPlayerOTurn = !Main.IsPlayerOTurn;
    }

    public void IAClick()
    {
        if (TileState != EnumState.Unpressed || Main.GameEnd)
        {
            return;
        }

        if (Main.IsPlayerOTurn)
        {
            //this.TextureNormal = PlayerO;
            TileState = EnumState.PlayerO;
        }
        Main.IsPlayerOTurn = !Main.IsPlayerOTurn;
    }

    public void Reset()
    {
        TileState = EnumState.Unpressed;
       // this.TextureNormal = Unpressed;
    }
}
