// src/main/java/io/northstar/behavior/controller/EscalationRulesController.java
package io.northstar.behavior.controller;

import io.northstar.behavior.dto.EscalationRulesDTO;
import io.northstar.behavior.dto.StudentEscalationStatusDTO;
import io.northstar.behavior.service.EscalationEvaluationService;
import io.northstar.behavior.service.EscalationRulesService;
import io.northstar.behavior.tenant.TenantContext;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class EscalationRulesController {

  private final EscalationRulesService service;
  private final EscalationEvaluationService evaluationService;

  public EscalationRulesController(EscalationRulesService service,
                                    EscalationEvaluationService evaluationService) {
    this.service = service;
    this.evaluationService = evaluationService;
  }

  // ==== ALERTS endpoint ====

  @GetMapping("/api/escalation-rules/alerts")
  public List<StudentEscalationStatusDTO> alerts(@RequestParam("schoolId") Long schoolId) {
    return evaluationService.evaluateStudents(schoolId);
  }

  // ==== A) CURRENT ROUTE (no path params), expects X-District-Id header + ?schoolId= ====

  @GetMapping("/api/escalation-rules")
  public ResponseEntity<EscalationRulesDTO> getByHeaderAndQuery(@RequestParam("schoolId") Long schoolId) {
    Long districtId = TenantContext.getDistrictId();
    if (districtId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    return ResponseEntity.ok(service.getOrDefaults(districtId, schoolId));
  }

  @PostMapping("/api/escalation-rules")
  public ResponseEntity<EscalationRulesDTO> upsertByHeaderAndQuery(
          @RequestParam("schoolId") Long schoolId,
          @RequestBody EscalationRulesDTO body) {
    Long districtId = TenantContext.getDistrictId();
    if (districtId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    return ResponseEntity.ok(service.upsert(districtId, schoolId, body));
  }

  // ==== B) FUTURE ROUTE (scoped in path): /api/districts/{districtId}/schools/{schoolId}/escalation-rules ====

  @GetMapping("/api/districts/{districtId}/schools/{schoolId}/escalation-rules")
  public ResponseEntity<EscalationRulesDTO> getScoped(
          @PathVariable Long districtId,
          @PathVariable Long schoolId) {
    Long ctx = TenantContext.getDistrictId();
    if (ctx == null || !ctx.equals(districtId)) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    return ResponseEntity.ok(service.getOrDefaults(districtId, schoolId));
  }

  @PostMapping("/api/districts/{districtId}/schools/{schoolId}/escalation-rules")
  public ResponseEntity<EscalationRulesDTO> upsertScoped(
          @PathVariable Long districtId,
          @PathVariable Long schoolId,
          @RequestBody EscalationRulesDTO body) {
    Long ctx = TenantContext.getDistrictId();
    if (ctx == null || !ctx.equals(districtId)) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    return ResponseEntity.ok(service.upsert(districtId, schoolId, body));
  }
}
