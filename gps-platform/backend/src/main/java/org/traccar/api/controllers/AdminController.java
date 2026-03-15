package org.traccar.api.controllers;

import org.traccar.service.AdminService;
import org.traccar.api.util.ApiResponse;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.util.Map;

@Path("/api/admin")
@Produces(MediaType.APPLICATION_JSON)
public class AdminController {

    @Inject
    private AdminService adminService;

    @GET
    @Path("/stats")
    public ApiResponse<Map<String, Object>> getStats() {
        return new ApiResponse<>(true, "Stats retrieved", adminService.getStats());
    }

}
