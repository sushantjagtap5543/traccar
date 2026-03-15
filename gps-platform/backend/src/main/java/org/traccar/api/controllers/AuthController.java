package org.traccar.api.controllers;

import java.util.HashMap;
import java.util.Map;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.traccar.api.util.ApiResponse;
import org.traccar.helper.PasswordHash;
import org.traccar.model.User;
import org.traccar.security.TokenManager;
import org.traccar.service.UserService;

@Path("/api/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthController {

    @Inject
    private UserService userService;

    @POST
    @Path("/login")
    public Response login(User request) {

        User user = userService.findByEmail(request.getEmail());

        if (user == null) {
            return Response.status(401)
                    .entity(new ApiResponse<>(false, "User not found", null))
                    .build();
        }

        if (!PasswordHash.verify(request.getPassword(), user.getPassword())) {
            return Response.status(401)
                    .entity(new ApiResponse<>(false, "Invalid password", null))
                    .build();
        }

        String token = TokenManager.generate(user.getId());

        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("user", user);

        return Response.ok(
                new ApiResponse<>(true, "Login successful", data)
        ).build();
    }

}
