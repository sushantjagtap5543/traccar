package org.traccar.service;

import org.traccar.model.Device;
import org.traccar.repository.DeviceRepository;
import jakarta.inject.Inject;
import java.util.List;

public class DeviceService {

    @Inject
    private DeviceRepository deviceRepository;

    public List<Device> getDevices() {
        return deviceRepository.getDevices();
    }

    public Device addDevice(Device device) {
        return deviceRepository.addDevice(device);
    }

    public void deleteDevice(long id) {
        deviceRepository.deleteDevice(id);
    }

}
