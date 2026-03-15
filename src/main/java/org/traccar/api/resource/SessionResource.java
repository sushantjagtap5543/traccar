package org.traccar.api.resource;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.traccar.model.User;
import org.traccar.storage.Storage;
import org.traccar.storage.query.Columns;
import org.traccar.storage.query.Condition;
import org.traccar.storage.query.Request;

@Path("session")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SessionResource {

    private final Storage storage;

    public SessionResource(Storage storage) {
        this.storage = storage;
    }

    @POST
    @Path("login")
    public Response login(User login) throws Exception {

        User user = storage.getObject(User.class,
            new Request(new Columns.All(),
            new Condition.Equals("email", login.getEmail())));

        if (user == null) {
            return Response.status(401).entity("User not found").build();
        }

        if (!user.getPassword().equals(login.getPassword())) {
            return Response.status(401).entity("Invalid password").build();
        }

        return Response.ok(user).build();
    }
}
