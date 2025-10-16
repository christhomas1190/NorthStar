package io.northstar.behavior.dto;

import java.time.OffsetDateTime;

public record BehaviorCategoryDTO(
        Long id,
        String name,
        String severity,
        String tier,
        String description,
        OffsetDateTime createdAt
) {}
