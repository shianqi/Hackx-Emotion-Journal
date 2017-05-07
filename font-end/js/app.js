var tab_change_state = true;

function removeClass(){
    $(".face-wrapper").children().removeAttr('class');
}
//伤心
function f1(){
    var face =  $(".face-wrapper").children();
    removeClass();
    $(face).addClass("case1");
}
//有点难过
function f2(){
    var face =  $(".face-wrapper").children();
    removeClass();
    $(face).addClass("case2");
}

//平常
function f3(){
    var face =  $(".face-wrapper").children();
    removeClass();
    $(face).addClass("case3");
}
//有点高兴
function f4(){
    var face =  $(".face-wrapper").children();
    removeClass();
    $(face).addClass("case4");
}
//非常高兴
function f5(){
    var face =  $(".face-wrapper").children();
    removeClass();
    $(face).addClass("case5");
}
//惊讶
function f6(){
    var face =  $(".face-wrapper").children();
    removeClass();
    $(face).addClass("case6");
}

//恐惧
function f7(){
    var face =  $(".face-wrapper").children();
    removeClass();
    $(face).addClass("case7");
}

//生气
function f8(){
    var face =  $(".face-wrapper").children();
    removeClass();
    $(face).addClass("case8");
}

function changeState(str){
    switch (str){
        case 'sadness': f1(); break;
        case 'disgust': f2(); break;
        case 'neutral': f3(); break;
        case 'contempt': f4(); break;
        case 'joy': f4();break;
        case 'happiness': f5(); break;
        case 'surprise': f6(); break;
        case 'fear': f7(); break;
        case 'anger': f8(); break;
    }
}

(function(){
    var video = document.getElementById('video');
    var canvas = document.getElementById('canvas');
    var canvasContext = canvas.getContext('2d');
    var audio_context;

    function __log(e, data) {
        console.log(e + " " + (data || ''));
    }

    function createRecorder(stream, handleMessage) {
                //获取视频数据
        if (navigator.mozGetUserMedia) {
            video.mozSrcObject = stream;
        } else {
            var vendorURL = window.URL || window.webkitURL;
            video.src = vendorURL.createObjectURL(stream);
        }
        video.play();

        var input = audio_context.createMediaStreamSource(stream);

        var recorder = new Recorder(input, {
            serverUrl: "wss://rating.llsstaging.com/llcup/stream/upload",
            handleMessage: handleMessage
        });

        __log('Recorder initialised.');

        return recorder;
    }

    var Page = function() {
        var self = this;
        var inited = false;
        var recorder = null;

        var handleMessage = function(resp) {
            try {
                var respObj = JSON.parse(resp);
                // if(respObj.decoded){
                //     textToEmotion(respObj.decoded);
                // }
                chat(respObj.decoded);
                self.overallScore(respObj.decoded);
                respObj.details.forEach(function(wordRate) {
                    self.wordRates.push({
                        word: wordRate.word,
                        score: wordRate.confidence
                    })
                });
            } catch (e) {
                //self.hasError(true);
                self.errorResp(resp);
                self.errorInfo(e.message);
            }
        };

        this.inited = ko.observable(false);
        initAudioSetting(function(stream){
            recorder = createRecorder(stream, handleMessage);
            self.inited(true);
        });

        this.hasError = ko.observable(false);
        this.errorResp = ko.observable('');
        this.errorInfo = ko.observable('');
        this.wordRates = ko.observableArray([]);
        this.readingRefText = ko.observable(randomPick(Constants.PreparedTexts));
        this.recording = ko.observable(false);
        this.overallScore = ko.observable();
        this.recordButtonText = ko.computed(function() {
            return self.recording() ? "▧" : "▶";
        });
        this.toggleRecording = function() {
            self.hasError(false);
            self.wordRates.removeAll();
            self.recording(!self.recording());
        };

        //this.switchRefText = function() {
        //  self.readingRefText(randomPick(Constants.PreparedTexts));
        //}

        this.recording.subscribe(function(){
            if(self.recording()) {
                /*
                 algConfig = {
                 type: 'readaloud',
                 quality: -1,
                 //reftext: self.readingRefText().replace(/[,.]/g, '')
                 reference: self.readingRefText().toLowerCase().replace(/[^A-Za-z0-9']/g, ' ').trim()
                 };
                 */
                algConfig = {
                    type: 'asr',
                    quality: -1
                };
                console.log(algConfig);
                recorder.record({
                    algConfig: algConfig
                });
            } else {
                recorder.stop();
                recorder.clear();
            }
        });
    }

    var initAudioSetting = function(startUserMediaCallback) {
        try {
            // webkit shim
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
            window.URL = window.URL || window.webkitURL;

            audio_context = new AudioContext;
            __log('Audio context set up.');
            __log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
        } catch (e) {
            alert('No web audio support in this browser!');
        }

        navigator.getUserMedia({
            audio: true,
            video: {
                mandatory: {
                    maxWidth: 320,
                    maxHeight: 240
                }
            }
        }, startUserMediaCallback, function(e) {
            __log('No live audio input: ' + e);
        });
    }

    window.onload = function init() {
        window.page = new Page();
        ko.applyBindings(window.page);
        setTimeout(imgToEmotion, 1000);
    };

    var tabButton = document.getElementById("tab-change");
    tabButton.addEventListener('click',function () {
        if(tabButton.checked){
            tab_change_state = false;
        }else{
            tab_change_state = true;
            imgToEmotion();
        }
    });
    var tabVideo = document.getElementById("tab-video");
    tabVideo.addEventListener('click',function () {
        if(tabVideo.checked){
            video.style.display = 'none';
        }else{
            video.style.display = 'block';
        }
    });

    function chat(str){
        var data = {data: str};
        $.ajax({
            url: "https://www.hupeng.wang/PicServer/re_chat.php",
            type: "POST",
            data: data
        }).done(function(data){
            document.getElementById("chat-box").innerText = data;
            textToEmotion(data);
        }).fail(function(){
            console.log('Chat Error!');
        })
    }

    function textToEmotion(str){
        var data = {data:str};
        $.ajax({
            url: "https://www.hupeng.wang/PicServer/re_text.php",
            type: "POST",
            data: data
        }).done(function(data){
            data = JSON.parse(data);
            console.log(data);
            var res = {name:"def",value:0};
            var emotion = data["document_tone"]["tone_categories"][0]["tones"];
            for(var i = 0;i<emotion.length;i++){
                if(emotion[i]["score"]>res.value){
                    res.value = emotion[i]["score"];
                    res.name = emotion[i]["tone_id"];
                }
            }
            console.log(res.name);
            changeState(res.name);
        }).fail(function(){
            console.log('textToEmotion Error');
        })
    }

    function imgToEmotion() {
        if(!tab_change_state) return;
        canvasContext.drawImage(video, 0, 0, 320, 240);
        var element = document.createElement("img");
        element.src = canvas.toDataURL();

        var pic = {data:element.src};

        $.ajax({
            url: "https://www.hupeng.wang/PicServer/re_pic.php",
            type: "POST",
            // Request body
            data: pic,
        }).done(function(data) {
            data = JSON.parse(data);
            if(data.length!==0){
                var res = {name:"def",value:0};
                var scores = data['0']["scores"];
                for(var score in scores){
                    //console.log(score,scores[score]);
                    if(scores[score]>res.value){
                        res.value = scores[score];
                        res.name = score;
                    }
                }
                changeState(res.name);
            }else{
                console.log("未识别到人");
            }
            setTimeout(imgToEmotion,0);
        }).fail(function() {
            setTimeout(imgToEmotion,0);
        });
    }
}).call(window);
