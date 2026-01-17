package io.northstar.behavior.service;

import io.northstar.behavior.dto.CreateIncidentRequest;
import io.northstar.behavior.dto.IncidentDTO;
import io.northstar.behavior.dto.IncidentSummaryDTO;
import io.northstar.behavior.model.Incident;


import java.util.List;

public interface IncidentService {
    IncidentDTO create(CreateIncidentRequest req);
    List<IncidentDTO> findAll();
    IncidentDTO findById(Long id);
    List<IncidentSummaryDTO> summaryForStudent(Long studentId);
    List<IncidentDTO> listForStudent(Long studentId, Long districtId);
    void delete(Long id);

    IncidentDTO createForStudent(Long studentId, Long districtId, CreateIncidentRequest req);
}