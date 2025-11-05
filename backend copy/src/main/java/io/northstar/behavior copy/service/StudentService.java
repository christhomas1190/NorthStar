package io.northstar.behavior.service;

import io.northstar.behavior.dto.StudentDTO;
import io.northstar.behavior.model.Student;

import java.util.List;

public interface StudentService {
        StudentDTO create(StudentDTO dto);
        List<StudentDTO> findAll();             // district-scoped
        StudentDTO findById(Long id);
        StudentDTO update(Long id, StudentDTO dto);
        void delete(Long id);
}
