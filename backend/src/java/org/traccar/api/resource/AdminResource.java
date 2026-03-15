package org.traccar.api.resource;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.traccar.model.Device;
import org.traccar.model.Position;
import org.traccar.storage.Storage;
import org.traccar.storage.query.Columns;
import org.traccar.storage.query.Request;
import org.traccar.service.DeviceStatusService;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

@Path("admin/devices")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AdminResource extends BaseResource {

    private final Storage storage;
    private final DeviceStatusService statusService;

    public AdminResource(Storage storage) {
        this.storage = storage;
        this.statusService = new DeviceStatusService(storage);
    }

    @GET
    public Response getStats() throws Exception {
        Collection<Device> devices = storage.getObjects(Device.class, new Request(new Columns.All()));
        
        long total = devices.size();
        long online = 0;
        long offline = 0;
        long unassigned = 0;

        for (Device device : devices) {
            if (device.getUserId() == 0) {
                unassigned++;
            }
            if (statusService.isDeviceOnline(device.getId())) {
                online++;
            } else {
                offline++;
            }
        }

        Map<String, Long> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("online", online);
        stats.put("offline", offline);
        stats.put("unassigned", unassigned);

        return Response.ok(stats).build();
    }
}
