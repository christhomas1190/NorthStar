package io.northstar.behavior.dto;

public record StudentEscalationStatusDTO(
        Long studentId,
        String studentName,
        int effectiveCautionCount,
        String status  // "CAUTION" or "ESCALATED"
) {}
