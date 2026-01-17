package io.northstar.behavior.dto;

import java.time.OffsetDateTime;

public record AdminNotificationDTO(
        Long id,
        Long studentId,
        String studentName,
        Long incidentId,
        String ruleName,
        String message,
        OffsetDateTime createdAt,
        boolean read
) {}