package io.northstar.behavior.controller;

import io.northstar.behavior.dto.EscalationRulesDTO;
import io.northstar.behavior.service.EscalationRulesService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/escalation-rules")
public class EscalationRulesController {

  private final EscalationRulesService service;

  public EscalationRulesController(EscalationRulesService service) {
    this.service = service;
  }

  @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
  public EscalationRulesDTO get() {
    return service.get();
  }

  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
  public EscalationRulesDTO upsert(@RequestBody EscalationRulesDTO dto) {
    return service.upsert(dto);
  }

  @PostMapping("/api/escalation-rules")
  public EscalationRulesDTO save(@RequestParam Long schoolId,
                                 @RequestBody EscalationRulesDTO body) {
    return service.create(schoolId, body);
  }
}
