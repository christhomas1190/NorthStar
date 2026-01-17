package io.northstar.behavior.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record CreateStudentRequest(
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotBlank String studentId,
        @NotBlank String grade,
        @NotNull Long schoolId       // e.g., “6”, “7”, “8”, “K”, “12”
) {



}
