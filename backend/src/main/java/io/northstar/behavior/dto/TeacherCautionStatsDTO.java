package io.northstar.behavior.dto;

public record TeacherCautionStatsDTO(
        Long teacherId,
        String teacherName,
        String userName,
        long totalCautions,
        String mostCommonCategory,
        long mostCommonCategoryCount,
        Long mostCautionedStudentId,
        String mostCautionedStudentName,
        long mostCautionedStudentCount
) {}
