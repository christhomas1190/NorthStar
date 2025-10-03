package io.northstar.behavior.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CreateStudentRequest(
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotBlank String studentId,   // school-issued ID (e.g., “A12345”)
        @NotBlank String grade        // e.g., “6”, “7”, “8”, “K”, “12”
) {

}
