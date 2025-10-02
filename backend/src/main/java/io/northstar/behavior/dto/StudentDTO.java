package io.northstar.behavior.dto;

import java.util.List;

public record StudentDTO (long id,
                          String firstName,
                          String lastName,
                          String studentId,
                          String grade,
                          List<IncidentSummaryDTO> incidents,
                          List<InterventionSummaryDTO> intervention)
{}
