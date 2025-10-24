package io.northstar.behavior.controller;

import io.northstar.behavior.dto.CreateIncidentRequest;
import io.northstar.behavior.dto.IncidentDTO;
import io.northstar.behavior.dto.IncidentSummaryDTO;
import io.northstar.behavior.service.IncidentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    private final IncidentService service;

    public IncidentController(IncidentService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<IncidentDTO> create(@RequestBody CreateIncidentRequest req) {
        return ResponseEntity.ok(service.create(req));
    }

    @GetMapping
    public List<IncidentDTO> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public IncidentDTO findOne(@PathVariable Long id) {
        return service.findById(id);
    }

    @GetMapping("/student/{studentId}/summary")
    public List<IncidentSummaryDTO> studentSummary(@PathVariable Long studentId) {
        return service.summaryForStudent(studentId);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
