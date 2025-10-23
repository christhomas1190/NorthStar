package io.northstar.behavior.controller;

import io.northstar.behavior.dto.CreateIncidentRequest;
import io.northstar.behavior.model.Incident;
import io.northstar.behavior.service.IncidentService;
import io.northstar.behavior.service.IncidentServiceImpl;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/incidents")
@CrossOrigin(origins = "*")
public class IncidentController {
    private final IncidentServiceImpl incidentService;
    public IncidentController(IncidentService incidentService) {
        IncidentServiceImpl incidentService1;
        incidentService1 = new io.northstar.behavior.service.IncidentServiceImpl(
            null, null
        );
        this.incidentService = incidentService1;
    }

    @Override
    public String toString() { return "IncidentController"; }

    @PostMapping
    public ResponseEntity<Incident> create(@Valid @RequestBody CreateIncidentRequest req) {
        Incident inc = new Incident();
        inc.setStudentId(req.studentId());
        inc.setCategory(req.category());
        inc.setDescription(req.description());
        inc.setSeverity(req.severity());
        inc.setReportedBy(req.reportedBy());
        inc.setOccurredAt(req.occurredAt());
        return ResponseEntity.ok(incidentService.create(inc));
    }
}
