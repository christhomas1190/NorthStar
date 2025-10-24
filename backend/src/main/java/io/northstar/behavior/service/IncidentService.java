package io.northstar.behavior.service;

import io.northstar.behavior.dto.CreateIncidentRequest;
import io.northstar.behavior.dto.IncidentDTO;
import io.northstar.behavior.dto.IncidentSummaryDTO;

import java.util.List;

public interface IncidentService {
    IncidentDTO create(CreateIncidentRequest req);
    List<IncidentDTO> findAll();
    IncidentDTO findById(Long id);
    List<IncidentSummaryDTO> summaryForStudent(Long studentId);
    void delete(Long id);
}
