package org.traccar.api.controllers;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.traccar.helper.PasswordHash;
import org.traccar.model.User;
import org.traccar.service.UserService;
import java.util.List;

@Path("/api/users")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UserController {

    @Inject
    private UserService userService;

    @GET
    public List<User> listUsers() {
        return userService.getAllUsers();
    }

    @POST
    public User createUser(User user) {
        user.setPassword(PasswordHash.hash(user.getPassword()));
        return userService.createUser(user);
    }

}
