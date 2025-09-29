package io.northstar.behavior.controller;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/students")
@Validated
public class StudentController {

    private final StudentService students;

    public StudentController(StudentService students) {
        this.students = students;
    }
