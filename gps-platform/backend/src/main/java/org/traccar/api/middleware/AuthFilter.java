package org.traccar.api.middleware;

import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.ext.Provider;
import org.traccar.security.TokenManager;

import java.io.IOException;

@Provider
public class AuthFilter implements ContainerRequestFilter {

    @Override
    public void filter(ContainerRequestContext ctx) throws IOException {

        String path = ctx.getUriInfo().getPath();
        if (path.endsWith("auth/login") || path.endsWith("users") && ctx.getMethod().equals("POST")) {
            return;
        }

        String token = ctx.getHeaderString("Authorization");

        if (token == null || !TokenManager.verify(token)) {
            throw new WebApplicationException(401);
        }

    }

}
