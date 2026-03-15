package org.traccar.api.controllers;

import org.traccar.service.ReportService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.util.List;
import java.util.Map;

@Path("/api/reports")
@Produces(MediaType.APPLICATION_JSON)
public class ReportController {

    @Inject
    private ReportService reportService;

    @GET
    @Path("/trips/{deviceId}")
    public List<Map<String, Object>> getTrips(@PathParam("deviceId") long deviceId) {
        return reportService.getTripSummary(deviceId);
    }

}
