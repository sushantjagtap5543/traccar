package org.traccar.api.resource;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.traccar.model.Event;
import org.traccar.storage.Storage;
import org.traccar.storage.query.Columns;
import org.traccar.storage.query.Condition;
import org.traccar.storage.query.Request;

import java.util.Collection;

@Path("events")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class EventResource extends BaseResource {

    private final Storage storage;

    public EventResource(Storage storage) {
        this.storage = storage;
    }

    @GET
    public Collection<Event> get(@QueryParam("deviceId") long deviceId) throws Exception {
        if (deviceId > 0) {
            return storage.getObjects(Event.class, new Request(new Columns.All(), new Condition.Equals("deviceId", deviceId)));
        }
        return storage.getObjects(Event.class, new Request(new Columns.All()));
    }

    @Path("{id}")
    @DELETE
    public Response remove(@PathParam("id") long id) throws Exception {
        storage.removeObject(Event.class, new Request(new Columns.All(), new Condition.Equals("id", id)));
        return Response.noContent().build();
    }
    
    @Path("clear")
    @POST
    public Response clear() throws Exception {
        // Simplified: remove all for now or filter by user
        Collection<Event> events = storage.getObjects(Event.class, new Request(new Columns.All()));
        for (Event event : events) {
            storage.removeObject(Event.class, new Request(new Columns.All(), new Condition.Equals("id", event.getId())));
        }
        return Response.ok().build();
    }
}
