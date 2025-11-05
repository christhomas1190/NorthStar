package io.northstar.behavior.dto;


import jakarta.annotation.Nullable;

public record UpdateTeacherRequest(
        @Nullable String firstName,
        @Nullable String lastName,
        @Nullable String email
) {}
