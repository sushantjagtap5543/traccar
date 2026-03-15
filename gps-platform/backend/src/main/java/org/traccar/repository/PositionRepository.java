package org.traccar.repository;

import org.traccar.model.Position;
import org.traccar.storage.Storage;
import org.traccar.storage.query.Columns;
import org.traccar.storage.query.Condition;
import org.traccar.storage.query.Request;

import jakarta.inject.Inject;
import java.util.List;

public class PositionRepository {

    @Inject
    private Storage storage;

    public List<Position> getPositions(long deviceId) {
        return storage.getObjects(
            Position.class,
            new Request(
                new Columns.All(),
                new Condition.Equals("deviceId", deviceId)
            )
        );
    }

}
