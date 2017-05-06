function randomPick(arr) {
  return arr[_.random(0, arr.length - 1)];
}

function getParameterInSearch(name){
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(location.search);
  return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function getParameter(name) {
  return getParameterInSearch(name);
}

function toRelativeWavKey(actor) {
  return actor.name.replace(/ /g, "_") + "-" + getHashCode(escape(JSON.stringify(actor)));
}

var getHashCode = function(str){
  // 1315423911=b'1001110011001111100011010100111'
  var hash  =   1315423911,i,ch;
  for (i = str.length - 1; i >= 0; i--) {
    ch = str.charCodeAt(i);
    hash ^= ((hash << 5) + ch + (hash >> 2));
  }
  
  return  (hash & 0x7FFFFFFF);
}

