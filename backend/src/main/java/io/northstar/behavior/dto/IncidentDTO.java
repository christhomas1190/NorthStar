package io.northstar.behavior.dto;

import java.time.OffsetDateTime;

public record IncidentDTO(
        long id,
        long studentId,
        String category,
        String description,
        String severity,
        String reportedBy,
        OffsetDateTime occurredAt,
        OffsetDateTime createdAt
) {
}
