package io.northstar.behavior.dto;

import java.time.OffsetDateTime;

public record TierChangeEventDTO(
        Long id,
        Long studentId,
        String studentName,
        String fromTier,
        String toTier,
        OffsetDateTime changedAt,
        String changedBy
) {}
