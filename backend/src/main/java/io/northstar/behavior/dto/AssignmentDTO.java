package io.northstar.behavior.dto;

import java.time.LocalDate;

public record AssignmentDTO(
        Long id,
        String name,
        String subject,
        LocalDate dueDate,
        int maxPoints,
        Long categoryId,
        String categoryName,
        Long teacherId,
        String teacherName
) {}
