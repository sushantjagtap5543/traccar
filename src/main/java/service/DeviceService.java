package service;

import java.util.List;
import model.User;

// Placeholder interfaces for the provided logic
interface Device {}
interface DeviceRepository {
    List<Device> findAll();
    List<Device> findByClientId(Long clientId);
}

public class DeviceService {

    private DeviceRepository deviceRepository;

    public List<Device> getDevices(User user) {

        if (user.isAdmin()) {
            return deviceRepository.findAll();
        }

        return deviceRepository.findByClientId(user.getId());
    }
}
