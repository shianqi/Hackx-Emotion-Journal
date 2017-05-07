package com.example.web;

import okhttp3.*;

import javax.net.ssl.*;
import java.io.IOException;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;

/**
 * Created by HUPENG on 2017/5/6.
 */
public class IbmUtil {
    private String basicAuth = "";

    /**
     * OkHttp库，主要用来执行网络请求
     * */
    private OkHttpClient client;

    private String getBasicAuthStr(String name,String password){
        return "Basic " + Base64.getEncoder().encodeToString((name + ":" + password).getBytes());
    }

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

    HostnameVerifier DO_NOT_VERIFY = new HostnameVerifier() {
        @Override
        public boolean verify(String hostname, SSLSession session) {
            return true;
        }
    };

    public  IbmUtil(String username,String password){
        try {
            sslContext = SSLContext.getInstance("SSL");
            sslContext.init(null, new TrustManager[]{xtm}, new SecureRandom());
        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
        } catch (KeyManagementException e) {
            e.printStackTrace();
        }
        basicAuth = getBasicAuthStr(username,password);
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



    public String getResult(String text){
        /**
         * curl -u "{username}":"{password}"
         * -H "Content-Type: application/json"
         * -d "{\"text\": \"A word is dead when it is said, some say. Emily Dickinson\"}"
         * "https://gateway.watsonplatform.net/tone-analyzer/api/v3/tone?version=2016-05-19"
         * */
        RequestBody formBody = RequestBody.create(MediaType.parse("application/json; charset=utf-8"), "{ \"text\": \"" + text + "\" }");


        final Request request = new Request.Builder()
                .url("https://gateway.watsonplatform.net/tone-analyzer/api/v3/tone?version=2016-05-19")
                .post(formBody)
                .header("Content-Type","application/json")
                .header("Authorization",basicAuth)
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
