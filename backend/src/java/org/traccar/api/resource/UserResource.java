package org.traccar.api.resource;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.traccar.model.User;
import org.traccar.storage.Storage;
import org.traccar.storage.query.Columns;
import org.traccar.storage.query.Condition;
import org.traccar.storage.query.Request;
import org.traccar.helper.PasswordHash;

import java.util.Collection;
import java.util.Map;

@Path("users")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UserResource extends BaseResource {

    private final Storage storage;

    public UserResource(Storage storage) {
        this.storage = storage;
    }

    @GET
    public Collection<User> get() throws Exception {
        return storage.getObjects(User.class, new Request(new Columns.All()));
    }

    @POST
    public Response add(User user) throws Exception {
        if (user.getEmail() == null || user.getPassword() == null) {
            return Response.status(400).entity("Missing email/password").build();
        }
        user.validate();
        user.setPassword(PasswordHash.hash(user.getPassword()));
        storage.addObject(user, new Request(new Columns.Exclude("id")));
        return Response.ok(user).build();
    }

    @Path("{id}")
    @GET
    public User getSingle(@PathParam("id") long id) throws Exception {
        return storage.getObject(User.class, new Request(new Columns.All(), new Condition.Equals("id", id)));
    }

    @Path("{id}")
    @PUT
    public Response update(User user) throws Exception {
        User existing = storage.getObject(User.class, new Request(new Columns.All(), new Condition.Equals("id", user.getId())));
        if (existing == null) {
            return Response.status(404).build();
        }
        
        // Don't update password unless provided and hashed correctly
        if (user.getPassword() != null && !user.getPassword().isEmpty() && !user.getPassword().equals(existing.getPassword())) {
            user.setPassword(PasswordHash.hash(user.getPassword()));
        } else {
            user.setPassword(existing.getPassword());
        }

        storage.updateObject(user, new Request(new Columns.All(), new Condition.Equals("id", user.getId())));
        return Response.ok(user).build();
    }

    @Path("{id}")
    @DELETE
    public Response remove(@PathParam("id") long id) throws Exception {
        storage.removeObject(User.class, new Request(new Columns.All(), new Condition.Equals("id", id)));
        return Response.noContent().build();
    }
}
