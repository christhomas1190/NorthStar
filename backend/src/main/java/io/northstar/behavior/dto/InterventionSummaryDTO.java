package io.northstar.behavior.dto;

import java.time.LocalDate;

public record InterventionSummaryDTO(
        long id,
        Long studentId,
        String studentName,
        String tier,
        String strategy,
        String description,
        LocalDate startDate,
        LocalDate endDate,
        Long districtId
) {}