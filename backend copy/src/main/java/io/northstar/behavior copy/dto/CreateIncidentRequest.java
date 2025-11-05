package io.northstar.behavior.dto;

import java.time.OffsetDateTime;

public record CreateIncidentRequest(
        Long studentId,
        String category,
        String description,
        String severity,
        String reportedBy,
        OffsetDateTime occurredAt
) {}
