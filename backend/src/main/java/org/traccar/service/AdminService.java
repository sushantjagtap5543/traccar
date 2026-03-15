package org.traccar.service;

import org.traccar.storage.Storage;
import org.traccar.storage.query.Columns;
import org.traccar.storage.query.Request;
import org.traccar.model.User;
import org.traccar.model.Device;
import jakarta.inject.Inject;
import java.util.HashMap;
import java.util.Map;

public class AdminService {

    @Inject
    private Storage storage;

    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // In a real implementation, these would be proper count queries
        stats.put("totalUsers", storage.getObjects(User.class, new Request(new Columns.All())).size());
        stats.put("totalDevices", storage.getObjects(Device.class, new Request(new Columns.All())).size());
        stats.put("activeSessions", 123); // Mock value
        stats.put("serverStatus", "online");
        
        return stats;
    }

}
