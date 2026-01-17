package io.northstar.behavior.service;

import java.time.LocalDate;
import java.util.Map;

public interface AnalyticsService {
    Map<String, Object> incidentSummary(Long schoolId, LocalDate start, LocalDate end);
}
