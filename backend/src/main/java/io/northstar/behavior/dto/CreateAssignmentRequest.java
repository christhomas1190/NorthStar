package io.northstar.behavior.dto;

import java.time.LocalDate;

public record CreateAssignmentRequest(String name, String subject, LocalDate dueDate, int maxPoints, Long categoryId) {}
