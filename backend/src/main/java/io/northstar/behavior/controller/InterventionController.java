package io.northstar.behavior.controller;

import io.northstar.behavior.dto.CreateInterventionRequest;
import io.northstar.behavior.dto.InterventionSummaryDTO;
import io.northstar.behavior.service.InterventionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class InterventionController {

    private final InterventionService service;

    public InterventionController(InterventionService service) {
        this.service = service;
    }

    // Creates a new intervention for a specific student
    @PostMapping("/api/students/{studentId}/interventions")
    public ResponseEntity<InterventionSummaryDTO> createForStudent(
            @PathVariable Long studentId,
            @Valid @RequestBody CreateInterventionRequest req
    ) {
        return ResponseEntity.ok(service.create(studentId, req));
    }

    // Retrieves all interventions for a specific student
    @GetMapping("/api/students/{studentId}/interventions")
    public List<InterventionSummaryDTO> listForStudent(@PathVariable Long studentId) {
        return service.listForStudent(studentId);
    }

    // Deletes an intervention by id
    @DeleteMapping("/api/interventions/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
