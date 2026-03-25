package io.northstar.behavior.dto;

public record DistrictDTO(
        Long id,
        String districtName,
        String status,
        String billingEmail,
        String contactName,
        Integer seatLimit,
        Integer maxSchools,
        boolean hasGradebook,
        boolean hasAcademicTrend
) {}
