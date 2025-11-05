package io.northstar.behavior.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateSchoolRequest(
        @NotBlank String name,
        @NotNull Long districtId
) {}
