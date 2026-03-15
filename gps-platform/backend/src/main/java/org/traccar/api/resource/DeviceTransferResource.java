package org.traccar.api.resource;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.traccar.storage.Storage;
import org.traccar.model.Device;
import org.traccar.storage.query.Condition;
import org.traccar.storage.query.Request;

@Path("devices/transfer")
@Produces(MediaType.APPLICATION_JSON)
public class DeviceTransferResource extends BaseResource {

    private final Storage storage;

    public DeviceTransferResource(Storage storage) {
        this.storage = storage;
    }

    @POST
    public Response transferDevice(
            @QueryParam("deviceId") long deviceId,
            @QueryParam("newClientId") long newClientId) throws Exception {

        Device device = storage.getObject(Device.class, new Request(new Condition.Equals("id", deviceId)));

        if (device == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        device.setUserId(newClientId);

        storage.updateObject(device, new Request(new Condition.Equals("id", deviceId)));

        return Response.ok(device).build();
    }
}
