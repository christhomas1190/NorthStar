package io.northstar.behavior.controller;

import io.northstar.behavior.dto.CreateStudentRequest;
import io.northstar.behavior.dto.StudentDTO;
import io.northstar.behavior.dto.IncidentDTO;
import io.northstar.behavior.dto.IncidentSummaryDTO;
import io.northstar.behavior.dto.InterventionSummaryDTO;

import io.northstar.behavior.model.Student;
import io.northstar.behavior.model.Incident;
import io.northstar.behavior.model.Intervention;

import io.northstar.behavior.service.StudentService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/students")
@Validated
public class StudentController {

    private final StudentService students;

    public StudentController(StudentService students) {
        this.students = students;
    }

    // CREATE
    @PostMapping
    public ResponseEntity<StudentDTO> create(@Valid @RequestBody CreateStudentRequest req) {
        Student s = students.create(
                req.firstName(),
                req.lastName(),
                req.studentId(),
                req.grade()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(toDTO(s));
    }

    // READ (by id)
    @GetMapping("/{id}")
    public ResponseEntity<StudentDTO> getOne(@PathVariable @Min(1) long id) {
        Student s = students.findById(id);
        return ResponseEntity.ok(toDTO(s));
    }

    // READ (list with optional findsearch)
    @GetMapping
    public ResponseEntity<List<StudentDTO>> list(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "25") @Min(1) int size
    ) {
        List<Student> results;
        if (q == null || q.isBlank()) {
            results = students.list(page, size);
        } else {
            results = students.search(q, page, size);
        }

        // simple “beginner-style” mapping with a for loop
        List<StudentDTO> dtos = new ArrayList<>();
        for (int i = 0; i < results.size(); i++) {
            dtos.add(toDTO(results.get(i)));
        }

        return ResponseEntity.ok(dtos);
    }
    // --- DTO mappers (kept simple, with for-loops where helpful) ---

    private StudentDTO toDTO(Student s) {
        List<IncidentSummaryDTO> incidents = new ArrayList<>();
        for (int i = 0; i < s.getIncidents().size(); i++) {
            Incident inc = s.getIncidents().get(i);
            incidents.add(new IncidentSummaryDTO(inc.getId(), inc.getCategory(), inc.getSeverity(), inc.getOccurredAt()));
        }

        List<InterventionSummaryDTO> interventions = new ArrayList<>();
        for (int i = 0; i < s.getInterventions().size(); i++) {
            Intervention iv = s.getInterventions().get(i);
            interventions.add(new InterventionSummaryDTO(iv.getId(), iv.getTier(), iv.getStrategy(), iv.getStartDate(), iv.getEndDate()));
        }
        return new StudentDTO(
                s.getId(),
                s.getFirstName(),
                s.getLastName(),
                s.getStudentId(),
                s.getGrade(),
                incidents,
                interventions
        );
    }

    private IncidentDTO toDTO(Incident inc) {
        return new IncidentDTO(
                inc.getId(),
                inc.getStudentId(),
                inc.getCategory(),
                inc.getDescription(),
                inc.getSeverity(),
                inc.getReportedBy(),
                inc.getOccurredAt(),
                inc.getCreatedAt()
        );
    }

}
