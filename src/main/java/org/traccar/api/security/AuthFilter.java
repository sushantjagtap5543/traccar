package org.traccar.api.security;

import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.ext.Provider;
import java.io.IOException;

@Provider
public class AuthFilter implements ContainerRequestFilter {

    @Override
    public void filter(ContainerRequestContext request) throws IOException {
        String token = request.getHeaderString("Authorization");

        if (token == null) {
            throw new WebApplicationException(401);
        }
        
        // Additional validation logic can be added here
    }
}
