package io.northstar.behavior.service;

import io.northstar.behavior.dto.EscalationRulesDTO;

public interface EscalationRulesService {
  EscalationRulesDTO get();
  EscalationRulesDTO upsert(EscalationRulesDTO dto);

  EscalationRulesDTO create(Long schoolId, EscalationRulesDTO body);
}
