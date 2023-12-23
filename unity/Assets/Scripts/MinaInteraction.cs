using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;

namespace Assets.Scripts
{
    public static class MinaInteraction
    {
#if UNITY_WEBGL
        [DllImport("__Internal")]
        public static extern void Connect(Action<int, string> callback);

        [DllImport("__Internal")]
        public static extern void Request(string jsonCall, Action<int, string> callback);

        [DllImport("__Internal")]
        public static extern bool IsMetamaskAvailable();

        [DllImport("__Internal")]
        public static extern string GetAccount();
#else
        // handle special platform like ios who throw an error on DllImport
        public static void Connect(Action<int, string> callback)
        {
        }
        public static void Request(string jsonCall, Action<int, string> callback)
        {
        }
        public static string GetAccount()
        {
            return string.Empty;
        }

        public static bool IsConnected()
        {
            return false;
        }
        public static string RequestRpcClientCallback(Action<string> rpcResponse, string rpcRequest)
        {
            return string.Empty;
        }
#endif

    }
}
