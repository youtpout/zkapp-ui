using System.Collections;
using System.Collections.Generic;
using System.Resources;
using UnityEngine;
using UnityEngine.UI;
using static UnityEditor.Experimental.GraphView.GraphView;

public class Tile : MonoBehaviour
{
    public EnumState TileState { get; set; }

    public Sprite Unpressed;
    public Sprite PlayerX;
    public Sprite PlayerO;

    private Button btnTile;

    // Start is called before the first frame update
    void Start()
    {
        btnTile = GetComponent<Button>();

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
            btnTile.image.sprite = PlayerX;
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
            btnTile.image.sprite = PlayerO;
            TileState = EnumState.PlayerO;
        }
        Main.IsPlayerOTurn = !Main.IsPlayerOTurn;
    }

    public void Reset()
    {
        TileState = EnumState.Unpressed;
        btnTile.image.sprite = Unpressed;
    }
}
