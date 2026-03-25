package io.northstar.behavior.service;

import io.northstar.behavior.dto.*;

import java.util.List;

public interface GradebookService {
    // Categories
    List<GradeCategoryDTO> getCategories();
    GradeCategoryDTO createCategory(CreateCategoryRequest req);
    GradeCategoryDTO updateCategory(Long id, CreateCategoryRequest req);
    void deleteCategory(Long id);

    // Assignments
    List<AssignmentDTO> getAssignments();
    AssignmentDTO createAssignment(CreateAssignmentRequest req);
    AssignmentDTO updateAssignment(Long id, CreateAssignmentRequest req);
    void deleteAssignment(Long id);

    // Grades
    List<GradeDTO> getGradesForStudent(Long studentId);
    GradeDTO upsertGrade(UpsertGradeRequest req);
    void deleteGrade(Long gradeId);

    // Summary
    List<GradebookSummaryDTO> getSummary();
}
