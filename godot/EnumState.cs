using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GodotMina
{
    public enum EnumState
    {
        Unpressed = 0,
        PlayerX = 1,
        PlayerO = 2
    }

    public enum EnumWinner
    {
        NotFinish = 0,
        Draw = 1,
        PlayerX = 2,
        PlayerO = 3
    }
}
