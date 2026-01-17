package io.northstar.behavior.dto;

import java.time.OffsetDateTime;

public record BehaviorCategoryDTO(
        Long id,
        String name,
        String description,
        String tier,
        String severity,
        Long schoolId,
        Long districtId
) {}
