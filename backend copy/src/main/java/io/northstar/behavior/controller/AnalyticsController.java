package io.northstar.behavior.controller;

import io.northstar.behavior.service.AnalyticsService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/schools/{schoolId}/analytics")
public class AnalyticsController {

    private final AnalyticsService analytics;

    public AnalyticsController(AnalyticsService analytics) {
        this.analytics = analytics;
    }

    @GetMapping("/incidents/summary")
    public Map<String, Object> incidentsSummary(@PathVariable Long schoolId,
                                                @RequestParam(required=false) String startDate,
                                                @RequestParam(required=false) String endDate) {
        LocalDate start = (startDate != null) ? LocalDate.parse(startDate) : LocalDate.now().minusDays(30);
        LocalDate end   = (endDate   != null) ? LocalDate.parse(endDate)   : LocalDate.now();
        return analytics.incidentSummary(schoolId, start, end);
    }
}
