package org.traccar.api.resource;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.servlet.http.HttpServletRequest;
import org.traccar.model.User;
import org.traccar.storage.Storage;
import org.traccar.storage.query.Columns;
import org.traccar.storage.query.Condition;
import org.traccar.storage.query.Request;
import org.traccar.helper.PasswordHash;
import org.traccar.security.TokenManager;
import org.traccar.security.LoginLimiter;

import java.util.Map;

@Path("session")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SessionResource {

    private final Storage storage;
    private final TokenManager tokenManager;

    public SessionResource(Storage storage) {
        this.storage = storage;
        this.tokenManager = new TokenManager();
    }

    @POST
    @Path("login")
    public Response login(User credentials) throws Exception {

        User user = storage.getObject(User.class,
            new Request(new Columns.All(),
            new Condition.Equals("email", credentials.getEmail())));

        if (user == null) {
            throw new WebApplicationException("User not found", 401);
        }

        if (!PasswordHash.verify(credentials.getPassword(), user.getPassword())) {
            throw new WebApplicationException("Invalid password", 401);
        }

        String token = tokenManager.createToken(user.getId());

        user.setPassword(null); // Safety: clear password before sending back

        return Response.ok(Map.of(
            "token", token,
            "user", user
        )).build();
    }

    @POST
    @Path("logout")
    public Response logout() {
        return Response.ok(Map.of("status", "logged_out")).build();
    }
}
