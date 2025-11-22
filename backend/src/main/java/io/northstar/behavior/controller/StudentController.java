// src/main/java/io/northstar/behavior/controller/StudentController.java
package io.northstar.behavior.controller;

import io.northstar.behavior.dto.CreateStudentRequest;
import io.northstar.behavior.dto.StudentDTO;
import io.northstar.behavior.service.StudentService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentService students;

    public StudentController(StudentService students) {
        this.students = students;
    }

    // Now takes CreateStudentRequest with schoolId
    @PostMapping
    public ResponseEntity<StudentDTO> create(@Valid @RequestBody CreateStudentRequest body) {
        StudentDTO saved = students.create(body);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping
    public List<StudentDTO> list() {
        return students.findAll();
    }
    @GetMapping("/{id}/report")
    public ResponseEntity<byte[]> report(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestHeader("X-District-Id") Long districtId
    ) {
        byte[] pdf = students.generateReportForStudent(id, districtId, from, to);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "application/pdf")
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"student_" + id + "_report.pdf\"")
                .body(pdf);
    }


    @GetMapping("/{id}")
    public StudentDTO getOne(@PathVariable @Min(1) Long id) {
        return students.findById(id);
    }

    @PutMapping("/{id}")
    public StudentDTO update(@PathVariable Long id, @Valid @RequestBody StudentDTO dto) {
        return students.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        students.delete(id);
    }
}
