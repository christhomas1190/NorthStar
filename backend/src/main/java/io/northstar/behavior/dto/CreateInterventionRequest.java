package io.northstar.behavior.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record CreateInterventionRequest(
        @NotBlank String tier,
        @NotBlank String strategy,
        @NotBlank String description,
        @NotBlank String assignedBy,
        @NotNull LocalDate startDate,
        LocalDate endDate,
        OffsetDateTime createdAt
) {}
