// src/main/java/io/northstar/behavior/service/AnalyticsServiceImpl.java
package io.northstar.behavior.service;

import io.northstar.behavior.model.Incident;
import io.northstar.behavior.model.School;
import io.northstar.behavior.repository.IncidentRepository;
import io.northstar.behavior.repository.SchoolRepository;
import io.northstar.behavior.tenant.TenantContext;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.*;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class AnalyticsServiceImpl implements AnalyticsService {

    private final IncidentRepository incidents;
    private final SchoolRepository schools;

    public AnalyticsServiceImpl(IncidentRepository incidents, SchoolRepository schools) {
        this.incidents = incidents;
        this.schools = schools;
    }

    @Override
    public Map<String, Object> incidentSummary(Long schoolId, LocalDate start, LocalDate end) { // <-- renamed
        if (schoolId == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "schoolId is required");

        Long districtId = TenantContext.getDistrictId(); // may be null in local tests
        School school = schools.findById(schoolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "school not found"));
        if (districtId != null &&
                (school.getDistrict() == null || !districtId.equals(school.getDistrict().getDistrictId()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "school not in current district");
        }

        LocalDate s = (start != null) ? start : LocalDate.now().minusDays(30);
        LocalDate e = (end   != null) ? end   : LocalDate.now();

        ZoneOffset offset = OffsetDateTime.now().getOffset();
        OffsetDateTime from = s.atStartOfDay().atOffset(offset);
        OffsetDateTime to   = e.plusDays(1).atStartOfDay().atOffset(offset);

        List<Incident> list = incidents.findBySchoolAndOccurredAtBetween(school, from, to);

        Map<LocalDate, Integer> byDate = new TreeMap<>();
        Map<String, Integer> byCategory = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
        Map<String, Integer> bySeverity = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);

        for (Incident i : list) {
            LocalDate d = i.getOccurredAt().toLocalDate();
            byDate.merge(d, 1, Integer::sum);
            if (i.getCategory() != null) byCategory.merge(i.getCategory(), 1, Integer::sum);
            if (i.getSeverity() != null) bySeverity.merge(i.getSeverity(), 1, Integer::sum);
        }

        List<Map<String,Object>> byDayArr = new ArrayList<>();
        for (Map.Entry<LocalDate,Integer> e1 : byDate.entrySet()) {
            Map<String,Object> row = new LinkedHashMap<>();
            row.put("date", e1.getKey().toString());
            row.put("count", e1.getValue());
            byDayArr.add(row);
        }

        List<Map<String,Object>> byCategoryArr = new ArrayList<>();
        for (Map.Entry<String,Integer> e2 : byCategory.entrySet()) {
            Map<String,Object> row = new LinkedHashMap<>();
            row.put("category", e2.getKey());
            row.put("count", e2.getValue());
            byCategoryArr.add(row);
        }

        List<Map<String,Object>> bySeverityArr = new ArrayList<>();
        for (Map.Entry<String,Integer> e3 : bySeverity.entrySet()) {
            Map<String,Object> row = new LinkedHashMap<>();
            row.put("severity", e3.getKey());
            row.put("count", e3.getValue());
            bySeverityArr.add(row);
        }

        Map<String,String> range = new LinkedHashMap<>();
        range.put("start", s.toString());
        range.put("end", e.toString());

        Map<String,Object> out = new LinkedHashMap<>();
        out.put("schoolId", schoolId);
        out.put("range", range);
        out.put("totalIncidents", list.size());
        out.put("byDay", byDayArr);
        out.put("byCategory", byCategoryArr);
        out.put("bySeverity", bySeverityArr);
        return out;
    }
}
