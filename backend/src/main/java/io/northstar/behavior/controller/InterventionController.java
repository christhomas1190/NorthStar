package io.northstar.behavior.controller;

import io.northstar.behavior.dto.CreateInterventionRequest;
import io.northstar.behavior.model.Intervention;
import io.northstar.behavior.model.Student;
import io.northstar.behavior.repository.InterventionRepository;
import io.northstar.behavior.repository.StudentRepository;
import io.northstar.behavior.service.BehaviorCategoryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/interventions")
@CrossOrigin(origins = "*")
public class InterventionController {
    private final StudentRepository students;
    private final InterventionRepository interventions;
    private BehaviorCategoryService service;

    public InterventionController(StudentRepository students, InterventionRepository interventions) {
        this.students = students;
        this.interventions = interventions;
    }

    @PostMapping
    public ResponseEntity<Intervention> create(@Valid @RequestBody CreateInterventionRequest req) {
        Student s = students.findById(req.studentId())
                .orElseThrow(() -> new IllegalArgumentException("Student not found: " + req.studentId()));
        Intervention iv = new Intervention();
        iv.setStudentId(s.getId());
        iv.setStudent(s);
        iv.setTier(req.tier());
        iv.setStrategy(req.strategy());
        iv.setAssignedBy(req.assignedBy());
        iv.setReportedBy(req.reportedBy());
        iv.setStartDate(req.startDate());
        iv.setEndDate(req.endDate());
        return ResponseEntity.ok(interventions.save(iv));
    }

    @GetMapping("/{studentId}")
    public ResponseEntity<List<Intervention>> listForStudent(@PathVariable long studentId) {
        return ResponseEntity.ok(interventions.findByStudentIdOrderByStartDateDesc(studentId));
    }
    @PutMapping("/{id}") public ResponseEntity<InterventionController> update(@PathVariable Long id, @RequestBody InterventionTemplate dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id); return ResponseEntity.noContent().build();
    }
}
