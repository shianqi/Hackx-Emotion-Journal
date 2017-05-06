(function(window){

  var WORKER_PATH = 'recorderWorker.js';

  var Recorder = function(source, cfg){
    var config = cfg || {};
    var self = this;
    var bufferLen = config.bufferLen || 4096;
    this.serverUrl = config.serverUrl;

    this.context = source.context;
    this.node = (this.context.createScriptProcessor ||
                 this.context.createJavaScriptNode).call(this.context,
                 bufferLen, 1, 1);
    this.handleMessage = cfg.handleMessage;
    var worker = new Worker(config.workerPath || WORKER_PATH);

    var recording = false,
      currCallback;

    this.node.onaudioprocess = function(e){
      if (!recording) return;
      var buffer = [];
      buffer = e.inputBuffer.getChannelData(0);
      worker.postMessage({
        command: 'record',
        buffer: buffer
      });
    }

    this.configure = function(cfg){
      for (var prop in cfg){
        if (cfg.hasOwnProperty(prop)){
          config[prop] = cfg[prop];
        }
      }
    }

    this.record = function(config){
      worker.postMessage({
        command: 'init',
        config: {
          sampleRate: this.context.sampleRate,
          serverUrl: this.serverUrl,
          algConfig: config.algConfig
        }
      });
      recording = true;
    }

    this.stop = function(){
      recording = false;
    }

    this.clear = function(){
      worker.postMessage({ command: 'clear' });
    }

    this.getBuffer = function(cb) {
      currCallback = cb || config.callback;
      worker.postMessage({ command: 'getBuffer' })
    }

    worker.onmessage = function(e){
      var blob = e.data;
      self.handleMessage(blob);
    }

    source.connect(this.node);
    this.node.connect(this.context.destination);    //this should not be necessary
  };

  window.Recorder = Recorder;

})(window);
