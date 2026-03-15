package org.traccar.repository;

import org.traccar.model.Device;
import org.traccar.storage.Storage;
import org.traccar.storage.query.Columns;
import org.traccar.storage.query.Request;
import org.traccar.storage.query.Condition;

import jakarta.inject.Inject;
import java.util.List;

public class DeviceRepository {

    @Inject
    private Storage storage;

    public List<Device> getDevices() {
        return storage.getObjects(Device.class, new Request(new Columns.All()));
    }

    public List<Device> getDevicesByGroup(long groupId) {
        return storage.getObjects(Device.class, new Request(new Columns.All(), new Condition.Equals("groupId", groupId)));
    }

    public Device addDevice(Device device) {
        storage.addObject(device, new Request(new Columns.Exclude("id")));
        return device;
    }

    public void deleteDevice(long id) {
        storage.removeObject(Device.class, new Request(new Columns.All(), new Condition.Equals("id", id)));
    }

}
