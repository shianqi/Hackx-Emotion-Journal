package com.example.web;



import com.baidu.translate.demo.TransApi;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.qingstor.sdk.exception.QSException;
import json.JSONObject;
import org.nutz.ioc.loader.annotation.IocBean;
import org.nutz.mvc.annotation.*;
import org.nutz.mvc.filter.CrossOriginFilter;
import org.nutz.mvc.ioc.provider.ComboIocProvider;

import javax.imageio.ImageIO;
import javax.net.ssl.*;
import javax.xml.bind.DatatypeConverter;
import java.awt.image.BufferedImage;
import java.io.*;

import java.lang.reflect.Field;
import java.nio.file.WatchService;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;



import com.qingstor.sdk.config.EvnContext;
import com.qingstor.sdk.service.*;



@SetupBy(value=MainSetup.class)
@IocBy(type=ComboIocProvider.class, args={"*js", "ioc/",
    "*anno", "com.example.web",
    "*tx",
    "*async"})
@IocBean
@Modules(scanPackage=true)
public class MainModule {
    @At("re_pic")
    @Ok("raw")
    @Fail("http:500")
    @Filters(@By(type = CrossOriginFilter.class))
    public Object rePic(@Param("data")String data) throws Exception {
        File file = new File("1.png");
        if (file.exists()){
            file.delete();
        }
//        String filePath = ("C:\\Users\\HUPENG\\Documents\\Tencent Files\\545061225\\FileRecv\\img.txt");
//        Toolkit.base64StringToImage(new BufferedReader(new InputStreamReader(new FileInputStream(new File(filePath)))).readLine());
        data = data.replace("data:image/png;base64,","").replace(" ","+");
        Toolkit.base64StringToImage(data);
        String path = uploadToQingCloud();

//        HttpsRequest.
        String result = new MicrosoftUtil().getResult(path);
        return result;
    }

    private String uploadToQingCloud() throws QSException {
        EvnContext evn = new EvnContext("EXOJWUUXWJOXXZHNBZIW", "XD6sTVpth2f1x8hLS9Qr9m1tb7UYPWxoyCsZ3Qr9");
        QingStor storService = new QingStor(evn);
        Bucket bucket = storService.getBucket("hupeng-oss","sh1a");
        Bucket.PutObjectInput input = new Bucket.PutObjectInput();
        File f = new File("1.png");
        input.setBodyInputFile(f);
        input.setContentType("image/png");
        input.setContentLength(f.length());
        String objName = (System.currentTimeMillis() + "") + new Random().nextLong() + ".png";
        bucket.putObject(objName,input);
        return "http://hupeng-oss.sh1a.qingstor.com/" + objName;
    }

    @At("re_text")
    @Ok("raw")
    @Fail("http:500")
    @Filters(@By(type = CrossOriginFilter.class))
    public Object reText(@Param("data")String data) {


        String text =
                "I am happy!";

// Call the service and get the tone
        IbmUtil ibmUtil = new IbmUtil("e51abab9-173f-4913-b9a3-3218bc219b8d","oKVcTJzQMnGf");
        String result = ibmUtil.getResult(data);


        return result;
    }

    @At("re_chat")
    @Ok("json")
    @Fail("http:500")
    @Filters(@By(type = CrossOriginFilter.class))
    public String reChat(@Param("data")String data)  {
        TransApi api = new TransApi("20170506000046495", "2KdGsc4xYbCh9mkrQdNL");
        String translatedText = getTransResult(api.getTransResult(data, "auto", "zh"));
        String turingResult = new TuringTalkUtil().getResult(translatedText);
        TuringBean turingBean = new Gson().fromJson(turingResult,TuringBean.class);
        return getTransResult(api.getTransResult(turingBean.getText(), "auto", "en"));
    }


    private String getTransResult(String source){
        try {
            JsonParser jsonParser = new JsonParser();
            JsonObject jsonObject = (JsonObject) jsonParser.parse(source);
            return jsonObject.get("trans_result").getAsJsonArray().get(0).getAsJsonObject().get("dst").getAsString();

        }catch (Exception e){
            return "I can't understand what you said";
        }

    }
}