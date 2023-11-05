using Godot;
using MinaSignerNet;
using System;
using System.Numerics;

public class Node2D : Godot.Node2D
{
    // Declare member variables here. Examples:
    // private int a = 2;
    // private string b = "text";

    // Called when the node enters the scene tree for the first time.
    public override void _Ready()
    {
        string key = "EKDtctFSZuDJ8SXuWcbXHot57gZDtu7dNSAZNZvXek8KF8q6jV8K";
        BigInteger message = BigInteger.Parse("123456");
        Signature signature = Signature.Sign(message, key, Network.Testnet);
        GD.Print("sign" + signature.ToString());
    }

    //  // Called every frame. 'delta' is the elapsed time since the previous frame.
    //  public override void _Process(float delta)
    //  {
    //      
    //  }
}
