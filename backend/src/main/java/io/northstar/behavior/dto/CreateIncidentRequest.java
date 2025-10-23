package io.northstar.behavior.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;

public record CreateIncidentRequest(
    @Min(1) long studentId,
    @NotBlank String category,
    @NotBlank String description,
    @NotBlank String severity,
    @NotBlank String reportedBy,
    @NotNull OffsetDateTime occurredAt
) {}
