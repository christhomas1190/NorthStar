package io.northstar.behavior.controller;

import io.northstar.behavior.dto.*;


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

    @PostMapping
    public ResponseEntity<StudentDTO> create(@Valid @RequestBody StudentDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(students.create(dto));
    }

    @GetMapping
    public List<StudentDTO> list() {
        return students.findAll();
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