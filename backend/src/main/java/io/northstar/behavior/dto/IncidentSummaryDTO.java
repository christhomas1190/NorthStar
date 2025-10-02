package io.northstar.behavior.dto;

import java.time.OffsetDateTime;

public record IncidentSummaryDTO(long id, String category, String severity, OffsetDateTime occurredAt){
}
