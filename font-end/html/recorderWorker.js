var recLength = 0,
    recBuffers = [],
    sampleRate,
    websocket;

this.onmessage = function(e){
  switch(e.data.command){
  case 'init':
    init(e.data.config);
    break;
  case 'record':
    record(e.data.buffer);
    break;
  case 'clear':
    clear();
    break;
  }
};

function init(config){
  sampleRate = config.sampleRate;
  initWebsocket(config.serverUrl, config.algConfig);
}

function initWebsocket(serverUrl, algConfig) {
  websocket = new WebSocket(serverUrl);
  var self = this;

  var reconnect = function() {
    initWebsocket(serverUrl, algConfig);
  }

  var extractResult = function(resultBuffer, metaLen, startPos) {
    var metaStartPos = 4;
    var bufView = new Uint8Array(resultBuffer);
    var metaBufView = bufView.subarray(metaStartPos, metaStartPos + metaLen);
    return eval("(" + String.fromCharCode.apply(null, metaBufView) + ")");
  }

  var handleSesameResult = function(data) {
    var reader = new FileReader();
    reader.addEventListener("loadend", function() {
      var resultBuffer = reader.result;
      var resultView = new DataView(resultBuffer);
      var metaLen = resultView.getUint32(0);
      var meta = extractResult(resultBuffer, metaLen, 4);
      var realResult = '';
      if(meta.result.length > 0) {
        //realResult = eval("(" + atob(meta.result) + ")");
        realResult = atob(meta.result);
      }
      self.postMessage(realResult);
    });
    reader.readAsArrayBuffer(data);
  }
  
  websocket.onmessage = function(event) {
    handleSesameResult(event.data);
  }
  
  websocket.onopen = function(event) {
    sendHead(algConfig);
    console.log("sended head");
  }

  websocket.onclose = function(event) {
    //reconnect();
  }

}

function resample2(buf) {
  var t = buf.length;
  var sampleRate = 44;
  var outputSampleRate = 16;
  var s = 0,
      o = sampleRate / outputSampleRate,
      u = Math.ceil(t * outputSampleRate / sampleRate),
      a = new Float32Array(u);
  for (i = 0; i < u; i++) {
    a[i] = buf[Math.floor(s)];
    s += o;
  }

  return a;
}

//44K to 16K
//since the current gadman algorithm is base on 1 channel 16k
//should consider a more elegant way to do that
function resample(buf) {
  var newLength = Math.ceil(buf.length * 16 / 44);
  var newBuf = new Float32Array(newLength);
  for(var i = 0; i < newLength; i++) {
    var mappingIndex = Math.floor(i * (44 / 16));
    newBuf[i] = buf[mappingIndex];
  }
  return newBuf;
}

function record(inputBuffer){
  //recBuffers.push(inputBuffer);
  //recLength += inputBuffer.length;
  send(resample2(inputBuffer));
}

function transformToPCM(samples) {
  var buffer = new ArrayBuffer(samples.length * 2);
  var view = new DataView(buffer);

  floatTo16BitPCM(view, 0, samples);
  return buffer;
}

function sendHead(algConfig) {
  var meta = btoa(JSON.stringify(algConfig));
  var metaLen = meta.length;
  
  var headBuffer = new ArrayBuffer(4 + metaLen);
  var view = new DataView(headBuffer);
  view.setUint32(0, metaLen, false);
  
  writeString(view, 4, meta);
  //writeString(view, 4, '2asdf');
  websocket.send(headBuffer);
}

function send(inputBuffer) {
  if (websocket.readyState == 1) { 
    var mediaBuffer = transformToPCM(inputBuffer);
    websocket.send(mediaBuffer);
  }
}

function sendEOF() {
  var eof = new ArrayBuffer(3);
  var eofView = new Uint8Array(eof);
  eofView[0] = 0x45;
  eofView[1] = 0x4f;
  eofView[2] = 0x53;
  websocket.send(eof);
}

function clear(){
  sendEOF();
  recLength = 0;
  recBuffers = [];
}

function floatTo16BitPCM(output, offset, input){
  for (var i = 0; i < input.length; i++, offset+=2){
    var s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

function writeString(view, offset, string){
  for (var i = 0; i < string.length; i++){
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
