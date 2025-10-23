package io.northstar.behavior.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record CreateInterventionRequest(
    @Min(1) long studentId,
    @NotBlank String tier,
    @NotBlank String strategy,
    @NotBlank String assignedBy,
    @NotBlank String reportedBy,
    @NotNull LocalDate startDate,
    LocalDate endDate
) {}
