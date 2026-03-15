package org.traccar.service;

import org.traccar.model.Position;
import org.traccar.repository.PositionRepository;
import jakarta.inject.Inject;
import java.util.List;

public class PositionService {

    @Inject
    private PositionRepository positionRepository;

    public List<Position> getPositions(long deviceId) {
        return positionRepository.getPositions(deviceId);
    }

}
