using MinaSignerNet;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Numerics;
using System.Text;
using System.Threading.Tasks;

namespace GodotMina
{
    /// <summary>
    /// Class like the gamestate struct in WinToken smartcontract use to generate signature
    /// </summary>
    public class GameState
    {
        public PublicKey Player1 { get; set; }
        public PublicKey Player2 { get; set; }
        public BigInteger Board { get; set; }
        public bool NextIsPlayer2 { get; set; }
        public UInt64 StartTimeStamp { get; set; }

        public GameState() { }

        public BigInteger Hash()
        {
            var listBigInteger = new List<BigInteger>
            {
                Player1.X,
                Player1.IsOdd.BoolToBigInteger(),
                Player2.X,
                Player2.IsOdd.BoolToBigInteger(),
                Board,
                NextIsPlayer2.BoolToBigInteger(),
                new BigInteger(StartTimeStamp)
            };
            return PoseidonHash.Hash(listBigInteger);
        }
    }
}
