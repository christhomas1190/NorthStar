package io.northstar.behavior.dto;

public record UpsertGradeRequest(Long studentId, Long assignmentId, Integer pointsEarned) {}
