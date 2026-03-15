package io.northstar.behavior.service;

import io.northstar.behavior.dto.StudentEscalationStatusDTO;

import java.util.List;

public interface EscalationEvaluationService {
    List<StudentEscalationStatusDTO> evaluateStudents(Long schoolId);
}
