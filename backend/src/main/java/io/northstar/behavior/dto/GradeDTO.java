package io.northstar.behavior.dto;

import java.time.OffsetDateTime;

public record GradeDTO(
        Long id,
        Long studentId,
        Long assignmentId,
        String assignmentName,
        String subject,
        Integer pointsEarned,
        int maxPoints,
        String categoryName,
        String teacherName,
        OffsetDateTime enteredAt
) {}
