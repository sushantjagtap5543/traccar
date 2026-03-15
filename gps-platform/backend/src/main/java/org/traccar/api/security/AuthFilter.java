package org.traccar.api.security;

import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.ext.Provider;
import org.traccar.security.TokenManager;

import java.io.IOException;

@Provider
public class AuthFilter implements ContainerRequestFilter {

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {

        String path = requestContext.getUriInfo().getPath();
        if (path.equals("session/login") || path.equals("register")) {
            return;
        }

        String token = requestContext.getHeaderString("Authorization");

        if (token == null || !TokenManager.verify(token)) {
            throw new WebApplicationException(401);
        }
        
        // Extract userId and put it in context for resources to use
        long userId = TokenManager.getUserId(token);
        requestContext.setProperty("userId", userId);
    }
}
