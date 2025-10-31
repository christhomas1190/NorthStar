package io.northstar.behavior.dto;

import java.time.LocalDate;

public record InterventionSummaryDTO(long id,
                                     String tier,
                                     String strategy,
                                     LocalDate startDate,
                                     LocalDate endDate,
                                     Long districtId
) {
}
