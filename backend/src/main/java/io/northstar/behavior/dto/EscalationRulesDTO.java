// src/main/java/io/northstar/behavior/dto/EscalationRulesDTO.java
package io.northstar.behavior.dto;

import java.time.OffsetDateTime;

public record EscalationRulesDTO(
        Long id,
        Integer tier1WindowDays,
        Integer reviewEveryDays,
        Integer sameCautionDetentionThreshold,
        Integer mixedCautionDetentionThreshold,
        Integer sameCautionTier2Threshold,
        String detentionLabel,
        Integer detentionDurationDays,
        String tier2Label,
        Integer tier2DurationDays,
        Integer tier1MajorToTier2,
        Integer tier2NoResponseCount,
        Integer tier2MajorToTier3,
        Boolean requireParentContact,
        Boolean requireAdminApproval,
        String notifyRoles,
        Integer decayCount,
        Integer decayDays,
        Long districtId,
        Long schoolId,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}
