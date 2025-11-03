package io.northstar.behavior.service;

import io.northstar.behavior.dto.CreateInterventionRequest;
import io.northstar.behavior.dto.InterventionSummaryDTO;
import java.util.List;

public interface InterventionService {
    InterventionSummaryDTO create(CreateInterventionRequest req);
    InterventionSummaryDTO update(Long id, CreateInterventionRequest req);
    List<InterventionSummaryDTO> listForStudent(Long studentId); // <- canonical
    void delete(Long id);
}
