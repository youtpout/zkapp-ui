using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using static UnityEditor.Experimental.GraphView.GraphView;

public class Main : MonoBehaviour
{
    public static bool IsPlayerOTurn = false;
    public static bool GameEnd = true;

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
