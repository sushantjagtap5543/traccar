package org.traccar.security;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.handler.HandlerInterceptorAdapter;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.time.LocalDateTime;

@Component
public class AuditInterceptor extends HandlerInterceptorAdapter {
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        System.out.println("USER: " + request.getUserPrincipal() +
                           " URL: " + request.getRequestURI() +
                           " METHOD: " + request.getMethod() +
                           " TIME: " + LocalDateTime.now());
        return true;
    }
}
