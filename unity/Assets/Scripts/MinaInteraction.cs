using System;
using System.Runtime.InteropServices;

namespace Assets.Scripts
{
    public static class MinaInteraction
    {
#if UNITY_WEBGL
        [DllImport("__Internal")]
        public static extern string GetAccount();
        [DllImport("__Internal")]
        public static extern string SendToMina(string state, string signature, string hash);
#else
        // handle special platform like ios who throw an error on DllImport
        public static string GetAccount()
        {
            return string.Empty;
        }

        public static string SendToMina(string state, string signature, string hash)
        {
            return string.Empty;
        }
#endif

    }
}
