package org.traccar.service;

import org.traccar.model.Device;
import org.traccar.storage.Storage;
import org.traccar.storage.query.Columns;
import org.traccar.storage.query.Request;
import jakarta.inject.Inject;

import java.io.BufferedReader;
import java.io.FileReader;

public class BulkDeviceImporter {

    private final Storage storage;

    @Inject
    public BulkDeviceImporter(Storage storage) {
        this.storage = storage;
    }

    public void importCSV(String path) throws Exception {

        try (BufferedReader reader = new BufferedReader(new FileReader(path))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String[] data = line.split(",");
                if (data.length >= 3) {
                    Device device = new Device();
                    device.setName(data[0]);
                    device.setUniqueId(data[1]);
                    device.setUserId(Long.parseLong(data[2]));

                    storage.addObject(device, new Request(new Columns.Exclude("id")));
                }
            }
        }
    }
}
