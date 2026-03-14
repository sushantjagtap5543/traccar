package controller;

import org.springframework.web.bind.annotation.*;
import java.util.List;
import service.ReportService;

interface Trip {}

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private ReportService reportService;

    @GetMapping("/trips")
    public List<Trip> getTrips(
        @RequestParam long deviceId,
        @RequestParam String from,
        @RequestParam String to
    ){
        return reportService.getTrips(deviceId, from, to);
    }
}
