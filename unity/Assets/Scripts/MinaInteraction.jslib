mergeInto(LibraryManager.library, {   
    GetAccount: function () {
      var returnValue = window.tictactoe.account;     
      if(returnValue !== null) {
            var bufferSize = lengthBytesUTF8(returnValue) + 1;
            var buffer = _malloc(bufferSize);
            stringToUTF8(returnValue, buffer, bufferSize);
            return buffer;
      }
      return "";
    },   
    SendToMina: function (state,signature,hash) {
      window.tictactoe.send(UTF8ToString(state),UTF8ToString(signature),UTF8ToString(hash));
    }   
});