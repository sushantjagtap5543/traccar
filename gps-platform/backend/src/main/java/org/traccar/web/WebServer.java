package org.traccar.web;

import jakarta.servlet.http.HttpServletResponse;

public class WebServer {

    public void handleHeaders(HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Headers", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
    }
}
