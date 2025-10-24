package io.northstar.behavior.controller;

import io.northstar.behavior.dto.CreateInterventionRequest;
import io.northstar.behavior.dto.InterventionSummaryDTO;
import io.northstar.behavior.service.InterventionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/interventions")
public class InterventionController {

    private final InterventionService service;

    public InterventionController(InterventionService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<InterventionSummaryDTO> create(@RequestBody CreateInterventionRequest req) {
        return ResponseEntity.ok(service.create(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<InterventionSummaryDTO> update(
            @PathVariable Long id,
            @RequestBody CreateInterventionRequest req
    ) {
        return ResponseEntity.ok(service.update(id, req));
    }

    @GetMapping("/student/{studentId}")
    public List<InterventionSummaryDTO> findByStudent(@PathVariable Long studentId) {
        return service.findByStudent(studentId);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
