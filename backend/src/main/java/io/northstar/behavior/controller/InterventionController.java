// src/main/java/io/northstar/behavior/controller/InterventionController.java
package io.northstar.behavior.controller;

import io.northstar.behavior.dto.CreateInterventionRequest;
import io.northstar.behavior.dto.InterventionSummaryDTO;
import io.northstar.behavior.service.InterventionService;
import jakarta.validation.Valid;
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
    public ResponseEntity<InterventionSummaryDTO> create(@Valid @RequestBody CreateInterventionRequest req) {
        return ResponseEntity.ok(service.create(req));
    }

    @GetMapping("/student/{studentId}")
    public List<InterventionSummaryDTO> listForStudent(@PathVariable Long studentId) {
        return service.listForStudent(studentId); // <-- FIXED (was findByStudent)
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
