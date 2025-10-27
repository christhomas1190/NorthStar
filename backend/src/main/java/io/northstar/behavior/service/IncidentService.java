package io.northstar.behavior.service;

import io.northstar.behavior.dto.CreateIncidentRequest;
import io.northstar.behavior.dto.IncidentDTO;
import io.northstar.behavior.dto.IncidentSummaryDTO;
import io.northstar.behavior.model.Incident;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.stereotype.Service;

import java.util.List;

public interface IncidentService {
    IncidentDTO create(CreateIncidentRequest req);
    IncidentDTO createForStudent(Long studentId, CreateIncidentRequest req);
    List<IncidentDTO> findAll();
    IncidentDTO findById(Long id);
    List<IncidentSummaryDTO> summaryForStudent(Long studentId);
    List<Incident> listForStudent(Long studentId);
    void delete(Long id);
}