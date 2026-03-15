package org.traccar.service;

import org.traccar.model.Device;
import org.traccar.repository.DeviceRepository;
import jakarta.inject.Inject;
import java.util.List;

public class ProvisioningService {

    @Inject
    private DeviceRepository deviceRepository;

    public void batchCreate(List<Device> devices) {
        for (Device device : devices) {
            deviceRepository.addDevice(device);
        }
    }

}
