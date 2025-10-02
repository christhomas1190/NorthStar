package io.northstar.behavior.dto;

public record StudentDTO (    long id,
                              String firstName,
                              String lastName,
                              String studentId,
                              String grade,
                              List<IncidentSummaryDTO> incidents,
                              List<InterventionSummaryDTO> intervention)
{}
