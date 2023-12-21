using System.Collections;
using System.Collections.Generic;
using UnityEditor.U2D.Path.GUIFramework;
using UnityEngine;
using UnityEngine.UI;

public class Main : MonoBehaviour
{
    public static bool IsPlayerOTurn = false;
    public static bool GameEnd = true;

    private long startGame = 0;

    private List<Tile> tiles = new List<Tile>();
    private Canvas gameOver;
    private Text lblGameOver;
    private Button btnGameOver;
    private Button btnSend;

    private string player1Key = string.Empty;
    private string player2Key = "EKFdQ8aJ6jDViUKhQcaUrUAXcTuixCyBSFayS8xx9vCG8puUyGPG";

    // Start is called before the first frame update
    void Start()
    {
        GameEnd = false;
    }

    // Update is called once per frame
    void Update()
    {

    }
}
