package io.northstar.behavior.dto;


public record CreateTeacherRequest(
        String firstName,
        String lastName,
        String email
) {}
