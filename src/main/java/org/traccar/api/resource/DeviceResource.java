package org.traccar.api.resource;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.traccar.model.Device;
import org.traccar.model.User;
import org.traccar.storage.Storage;
import org.traccar.storage.query.Columns;
import org.traccar.storage.query.Condition;
import org.traccar.storage.query.Request;

import java.util.Collection;

@Path("devices")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class DeviceResource extends BaseResource {

    private final Storage storage;

    public DeviceResource(Storage storage) {
        this.storage = storage;
    }

    @GET
    public Collection<Device> get() throws Exception {
        return storage.getObjects(Device.class,
            new Request(new Columns.All(),
            new Condition.Permission(User.class, getUserId(), Device.class)));
    }
}
