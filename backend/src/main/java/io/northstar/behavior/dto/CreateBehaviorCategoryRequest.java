package io.northstar.behavior.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateBehaviorCategoryRequest(

        @NotNull
        Long schoolId,

        @NotBlank
        String name,

        String description,

        @NotBlank
        String tier,      // e.g. "Tier 1"

        @NotBlank
        String severity   // e.g. "Minor" or "Major"
) {}