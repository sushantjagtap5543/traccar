package org.traccar.service;

import org.traccar.storage.Storage;
import org.traccar.model.Position;
import org.traccar.storage.query.Condition;
import org.traccar.storage.query.Request;
import jakarta.inject.Inject;

import java.util.Date;

public class DeviceStatusService {

    private final Storage storage;

    @Inject
    public DeviceStatusService(Storage storage) {
        this.storage = storage;
    }

    public boolean isDeviceOnline(long deviceId) throws Exception {

        Position position = storage.getObject(
                Position.class,
                new Request(new Condition.Equals("deviceId", deviceId))
        );

        if (position == null || position.getFixTime() == null) {
            return false;
        }

        long diff = new Date().getTime() - position.getFixTime().getTime();

        return diff < 300000;
    }
}
