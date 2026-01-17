// src/main/java/io/northstar/behavior/service/EscalationRulesService.java
package io.northstar.behavior.service;

import io.northstar.behavior.dto.EscalationRulesDTO;

public interface EscalationRulesService {
  EscalationRulesDTO getOrDefaults(Long districtId, Long schoolId);
  EscalationRulesDTO upsert(Long districtId, Long schoolId, EscalationRulesDTO body);
}
