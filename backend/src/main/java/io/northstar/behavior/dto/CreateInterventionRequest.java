package io.northstar.behavior.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record CreateInterventionRequest(
        Long studentId,
        String tier,
        String strategy,
        String assignedBy,
        String reportedBy,
        LocalDate startDate,
        LocalDate endDate,
        OffsetDateTime createdAt
) {}
