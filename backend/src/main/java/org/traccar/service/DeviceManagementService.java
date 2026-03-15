package org.traccar.service;

import org.traccar.model.Device;
import org.traccar.storage.Storage;
import org.traccar.storage.query.Columns;
import org.traccar.storage.query.Condition;
import org.traccar.storage.query.Request;
import jakarta.inject.Inject;

import java.util.List;

public class DeviceManagementService {

    private final Storage storage;

    @Inject
    public DeviceManagementService(Storage storage) {
        this.storage = storage;
    }

    public Device createDevice(Device device) throws Exception {
        storage.addObject(device, new Request(new Columns.Exclude("id")));
        return device;
    }

    public void updateDevice(Device device) throws Exception {
        storage.updateObject(device, new Request(new Condition.Equals("id", device.getId())));
    }

    public void deleteDevice(long deviceId) throws Exception {
        storage.removeObject(Device.class, new Request(new Condition.Equals("id", deviceId)));
    }

    public Device getDevice(long id) throws Exception {
        return storage.getObject(Device.class, new Request(new Condition.Equals("id", id)));
    }

    public List<Device> getClientDevices(long clientId) throws Exception {
        return storage.getObjects(Device.class, new Request(new Condition.Equals("userId", clientId)));
    }
}
