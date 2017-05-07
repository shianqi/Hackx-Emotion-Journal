package com.example.web;

import okhttp3.*;
import okio.BufferedSink;

import javax.net.ssl.*;
import java.io.IOException;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

/**
 * Created by HUPENG on 2017/5/6.
 */
public class MicrosoftUtil {
    static  String[] keyPool = {"18255d1269744d96afae892663dd38a2","dcff043d2bb24606aa83990c0784bcc7","0002af94ea76440bb65b01065fc5970d","c2358d4a42f44a02b6c7521ed4311b96"};
    static int  now = 0;

    X509TrustManager xtm = new X509TrustManager() {
        @Override
        public void checkClientTrusted(X509Certificate[] chain, String authType) {
        }

        @Override
        public void checkServerTrusted(X509Certificate[] chain, String authType) {
        }

        @Override
        public X509Certificate[] getAcceptedIssuers() {
            X509Certificate[] x509Certificates = new X509Certificate[0];
            return x509Certificates;
        }
    };
    SSLContext sslContext = null;
    public  MicrosoftUtil(){
        try {
            sslContext = SSLContext.getInstance("SSL");
            sslContext.init(null, new TrustManager[]{xtm}, new SecureRandom());
        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
        } catch (KeyManagementException e) {
            e.printStackTrace();
        }
        HostnameVerifier DO_NOT_VERIFY = new HostnameVerifier() {
            @Override
            public boolean verify(String hostname, SSLSession session) {
                return true;
            }
        };

        client  = new OkHttpClient.Builder()
                .cookieJar(new CookieJar() {
                    private final HashMap<String, List<Cookie>> cookieStore = new HashMap<String, List<Cookie>>();
                    @Override
                    public void saveFromResponse(HttpUrl url, List<Cookie> cookies) {
                        cookieStore.put(url.host(), cookies);
                    }

                    @Override
                    public List<Cookie> loadForRequest(HttpUrl url) {
                        List<Cookie> cookies = cookieStore.get(url.host());
                        return cookies != null ? cookies : new ArrayList<Cookie>();
                    }
                })
                .sslSocketFactory(sslContext.getSocketFactory())
                .hostnameVerifier(DO_NOT_VERIFY)
                .build();
    }

    HostnameVerifier DO_NOT_VERIFY = new HostnameVerifier() {
        @Override
        public boolean verify(String hostname, SSLSession session) {
            return true;
        }
    };

    /**
     * OkHttp库，主要用来执行网络请求
     * */
    private OkHttpClient client;


    public String getResult(String url){
        RequestBody formBody = RequestBody.create(MediaType.parse("application/json; charset=utf-8"), "{ \"url\": \"" + url + "\" }");

        int i = now % keyPool.length;
        now ++;
        if (now> 10000){
            now = now % keyPool.length;
        }

        final Request request = new Request.Builder()
                .url("https://api.cognitive.azure.cn/emotion/v1.0/recognize")
                .post(formBody)
                .header("Content-Type","application/json")
                .header("Ocp-Apim-Subscription-Key",keyPool[i])
                .build();
        try {

            Response response = client.newCall(request).execute();

            return response.body().string();
        } catch (IOException e) {
            e.printStackTrace();
        }
        return null;
    }
}
