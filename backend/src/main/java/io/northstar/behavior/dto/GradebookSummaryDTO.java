package io.northstar.behavior.dto;

import java.util.Map;

public record GradebookSummaryDTO(
        Long studentId,
        String studentName,
        double weightedAverage,
        String letterGrade,
        Map<String, Double> categoryBreakdown
) {}
