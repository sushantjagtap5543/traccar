package service;

import java.util.Map;

interface Position {
    double getSpeed();
    Map<String, Object> getAttributes();
}

interface Device {
    String getId();
    double getSpeedLimit();
    boolean isOnline();
}

public class AlertService {

    public void processPosition(Position position, Device device) {

        if (position.getSpeed() > device.getSpeedLimit()) {
            createAlert(device, "Speed violation");
        }

        if (!device.isOnline()) {
            createAlert(device, "Device offline");
        }

        if (Boolean.TRUE.equals(position.getAttributes().get("ignition"))) {
            createAlert(device, "Ignition ON");
        }
    }

    private void createAlert(Device device, String message) {
        System.out.println("Alert: " + message + " Device: " + device.getId());
    }
}
