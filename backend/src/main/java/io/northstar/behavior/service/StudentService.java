package io.northstar.behavior.service;

import io.northstar.behavior.model.Student;

import java.util.List;

public interface StudentService {

        Student create(String firstName, String lastName, String studentId, String grade);

        // Simple list (no paging) — used by some tests/tools
        List<Student> findAll();

        Student findById(Long id);

        void delete(Long id);

        // What your controller calls when q is blank
        List<Student> list(int page, int size);

        // What your controller calls when q is provided
        List<Student> search(String q, int page, int size);
}
