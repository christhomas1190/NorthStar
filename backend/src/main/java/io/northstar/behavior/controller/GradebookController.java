package io.northstar.behavior.controller;

import io.northstar.behavior.dto.*;
import io.northstar.behavior.service.GradebookService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gradebook")
public class GradebookController {

    private final GradebookService service;

    public GradebookController(GradebookService service) {
        this.service = service;
    }

    // --- Categories ---
    @GetMapping("/categories")
    public List<GradeCategoryDTO> getCategories() {
        return service.getCategories();
    }

    @PostMapping("/categories")
    @ResponseStatus(HttpStatus.CREATED)
    public GradeCategoryDTO createCategory(@RequestBody CreateCategoryRequest req) {
        return service.createCategory(req);
    }

    @PutMapping("/categories/{id}")
    public GradeCategoryDTO updateCategory(@PathVariable Long id, @RequestBody CreateCategoryRequest req) {
        return service.updateCategory(id, req);
    }

    @DeleteMapping("/categories/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCategory(@PathVariable Long id) {
        service.deleteCategory(id);
    }

    // --- Assignments ---
    @GetMapping("/assignments")
    public List<AssignmentDTO> getAssignments() {
        return service.getAssignments();
    }

    @PostMapping("/assignments")
    @ResponseStatus(HttpStatus.CREATED)
    public AssignmentDTO createAssignment(@RequestBody CreateAssignmentRequest req) {
        return service.createAssignment(req);
    }

    @PutMapping("/assignments/{id}")
    public AssignmentDTO updateAssignment(@PathVariable Long id, @RequestBody CreateAssignmentRequest req) {
        return service.updateAssignment(id, req);
    }

    @DeleteMapping("/assignments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAssignment(@PathVariable Long id) {
        service.deleteAssignment(id);
    }

    // --- Grades ---
    @GetMapping("/students/{studentId}/grades")
    public List<GradeDTO> getGradesForStudent(@PathVariable Long studentId) {
        return service.getGradesForStudent(studentId);
    }

    @PostMapping("/grades")
    public GradeDTO upsertGrade(@RequestBody UpsertGradeRequest req) {
        return service.upsertGrade(req);
    }

    @DeleteMapping("/grades/{gradeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteGrade(@PathVariable Long gradeId) {
        service.deleteGrade(gradeId);
    }

    // --- Summary ---
    @GetMapping("/summary")
    public List<GradebookSummaryDTO> getSummary() {
        return service.getSummary();
    }
}
