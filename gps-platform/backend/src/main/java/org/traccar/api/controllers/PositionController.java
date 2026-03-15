package org.traccar.api.controllers;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.traccar.model.Position;
import org.traccar.service.PositionService;
import java.util.List;

@Path("/api/positions")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PositionController {

    @Inject
    private PositionService positionService;

    @GET
    @Path("/{deviceId}")
    public List<Position> getPositions(@PathParam("deviceId") long deviceId) {
        return positionService.getPositions(deviceId);
    }

}
