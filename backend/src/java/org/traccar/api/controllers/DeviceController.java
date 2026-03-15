package org.traccar.api.controllers;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.traccar.model.Device;
import org.traccar.service.DeviceService;
import java.util.List;

@Path("/api/devices")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class DeviceController {

    @Inject
    private DeviceService deviceService;

    @GET
    public List<Device> listDevices() {
        return deviceService.getDevices();
    }

    @POST
    public Device addDevice(Device device) {
        return deviceService.addDevice(device);
    }

    @DELETE
    @Path("/{id}")
    public void deleteDevice(@PathParam("id") long id) {
        deviceService.deleteDevice(id);
    }

}
