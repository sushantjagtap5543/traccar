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
import java.util.List;
import org.traccar.helper.DistanceCalculator;
import org.traccar.storage.query.Condition;

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
    @Path("dashboard")
    public Response getDashboardStats() throws Exception {
        Collection<Device> devices = storage.getObjects(Device.class, new Request(new Columns.All()));
        Collection<org.traccar.model.User> users = storage.getObjects(org.traccar.model.User.class, new Request(new Columns.All()));
        
        long totalVehicles = devices.size();
        long onlineVehicles = 0;
        long offlineVehicles = 0;
        
        for (Device device : devices) {
            if (statusService.isDeviceOnline(device.getId())) {
                onlineVehicles++;
            } else {
                offlineVehicles++;
            }
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalVehicles", totalVehicles);
        stats.put("onlineVehicles", onlineVehicles);
        stats.put("offlineVehicles", offlineVehicles);
        stats.put("activeUsers", users.size());
        
        // Mocking daily stats for logic demonstration
        stats.put("dailyDistance", 1245.8);
        stats.put("overallDistance", 158420.5);
        stats.put("dailyTrips", 42);
        stats.put("overallTrips", 1250);

        return Response.ok(stats).build();
    }

    @GET
    @Path("client/{userId}")
    public Response getClientStats(@PathParam("userId") long userId) throws Exception {
        Collection<Device> devices = storage.getObjects(Device.class, 
            new Request(new Columns.All(), new org.traccar.storage.query.Condition.Equals("userId", userId)));
        
        long total = devices.size();
        long online = 0;
        long offline = 0;

        for (Device device : devices) {
            if (statusService.isDeviceOnline(device.getId())) {
                online++;
            } else {
                offline++;
            }
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("online", online);
        stats.put("offline", offline);
        
        // Client specific distance/trips
        long now = System.currentTimeMillis();
        long dayAgo = now - (24 * 60 * 60 * 1000);
        
        List<Position> lastDayPos = storage.getObjects(Position.class, new Request(
            new Columns.All(), 
            new Condition.Between("serverTime", dayAgo, now)
        ));

        // Note: Filter for client devices would ideally be on SQL side
        // Filter collection manually for safety with generic Storage interface
        lastDayPos.removeIf(p -> devices.stream().noneMatch(d -> d.getId() == p.getDeviceId()));

        List<Position> allTimePos = storage.getObjects(Position.class, new Request(new Columns.All()));
        allTimePos.removeIf(p -> devices.stream().noneMatch(d -> d.getId() == p.getDeviceId()));

        double dailyDist = 0;
        double overallDist = 0;
        
        for (int i = 1; i < lastDayPos.size(); i++) {
            Position p1 = lastDayPos.get(i-1);
            Position p2 = lastDayPos.get(i);
            if (p1.getDeviceId() == p2.getDeviceId()) {
               dailyDist += DistanceCalculator.distance(p1.getLatitude(), p1.getLongitude(), p2.getLatitude(), p2.getLongitude());
            }
        }
        
        for (int i = 1; i < allTimePos.size(); i++) {
            Position p1 = allTimePos.get(i-1);
            Position p2 = allTimePos.get(i);
            if (p1.getDeviceId() == p2.getDeviceId()) {
               overallDist += DistanceCalculator.distance(p1.getLatitude(), p1.getLongitude(), p2.getLatitude(), p2.getLongitude());
            }
        }

        stats.put("dailyDistance", Math.round(dailyDist * 100.0) / 100.0);
        stats.put("overallDistance", Math.round(overallDist * 100.0) / 100.0);
        stats.put("dailyTrips", lastDayPos.size() / 10); // Approximation
        stats.put("overallTrips", allTimePos.size() / 10);

        return Response.ok(stats).build();
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
