package org.traccar.api.controllers;

import org.traccar.service.ProvisioningService;
import org.traccar.model.Device;
import org.traccar.api.util.ApiResponse;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.util.List;

@Path("/api/provisioning")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ProvisioningController {

    @Inject
    private ProvisioningService provisioningService;

    @POST
    @Path("/batch")
    public ApiResponse<String> batchAdd(List<Device> devices) {
        provisioningService.batchCreate(devices);
        return new ApiResponse<>(true, "Batch provisioning successful", null);
    }

}
