package org.traccar.api.resource;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.traccar.model.Device;
import org.traccar.storage.Storage;
import org.traccar.storage.query.Columns;
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
    public Collection<Device> get(@QueryParam("all") boolean all, @QueryParam("userId") long userId) throws Exception {
        if (all) {
            return storage.getObjects(Device.class, new Request(new Columns.All()));
        } else if (userId > 0) {
            return storage.getObjects(Device.class, new Request(new Condition.Equals("userId", userId)));
        } else {
            // Default behavior: return all for now or filter by current user if session is available
            return storage.getObjects(Device.class, new Request(new Columns.All()));
        }
    }

    @Path("{id}")
    @GET
    public Device getSingle(@PathParam("id") long id) throws Exception {
        return storage.getObject(Device.class, new Request(new Condition.Equals("id", id)));
    }

    @POST
    public Response add(Device device) throws Exception {
        storage.addObject(device, new Request(new Columns.Exclude("id")));
        return Response.ok(device).build();
    }

    @Path("{id}")
    @PUT
    public Response update(Device device) throws Exception {
        storage.updateObject(device, new Request(new Condition.Equals("id", device.getId())));
        return Response.ok(device).build();
    }

    @Path("{id}")
    @DELETE
    public Response remove(@PathParam("id") long id) throws Exception {
        storage.removeObject(Device.class, new Request(new Condition.Equals("id", id)));
        return Response.noContent().build();
    }

    @Path("import")
    @POST
    public Response importDevices(@QueryParam("path") String path) throws Exception {
        org.traccar.service.BulkDeviceImporter importer = new org.traccar.service.BulkDeviceImporter(storage);
        importer.importCSV(path);
        return Response.ok().build();
    }

    @Path("client/{clientId}")
    @GET
    public Collection<Device> getByClient(@PathParam("clientId") long clientId) throws Exception {
        return storage.getObjects(Device.class, new Request(new Condition.Equals("userId", clientId)));
    }

    @Path("status/{deviceId}")
    @GET
    public Response getStatus(@PathParam("deviceId") long deviceId) throws Exception {
        org.traccar.service.DeviceStatusService statusService = new org.traccar.service.DeviceStatusService(storage);
        boolean online = statusService.isDeviceOnline(deviceId);
        return Response.ok(java.util.Collections.singletonMap("online", online)).build();
    }
}
