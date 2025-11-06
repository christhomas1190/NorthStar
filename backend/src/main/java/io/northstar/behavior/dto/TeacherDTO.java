package io.northstar.behavior.dto;

public record TeacherDTO(
        Long id,
        String firstName,
        String lastName,
        String email,
        String username,
        Long districtId,
        Long schoolId
) {}
