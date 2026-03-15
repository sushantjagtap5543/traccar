package org.traccar.api.resource;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.traccar.model.User;
import org.traccar.storage.Storage;

@Path("register")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)

public class RegisterResource {

    private final Storage storage;

    public RegisterResource(Storage storage) {
        this.storage = storage;
    }

    @POST
    public Response register(User user) throws Exception {

        if (user.getEmail() == null || user.getPassword() == null) {
            return Response.status(400).entity("Missing fields").build();
        }

        user.setAdministrator(false);

        storage.addObject(user, null);

        return Response.ok(user).build();
    }
}
