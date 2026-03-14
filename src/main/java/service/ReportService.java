package service;

import java.util.List;

interface Trip {}
interface TripRepository {
    List<Trip> findTrips(long deviceId, String from, String to);
}

public class ReportService {

    private TripRepository tripRepository;

    public List<Trip> getTrips(long deviceId, String from, String to) {
        return tripRepository.findTrips(deviceId, from, to);
    }
}
