package io.northstar.behavior.service;

import io.northstar.behavior.dto.CreateStudentRequest;
import io.northstar.behavior.dto.StudentDTO;

import java.time.LocalDate;
import java.util.List;

public interface StudentService {
        // New: create with schoolId
        StudentDTO create(CreateStudentRequest req);

        // Legacy path (kept for now)
        StudentDTO create(StudentDTO dto);
        byte[] generateReportForStudent(Long studentId,
                                        Long districtId,
                                        LocalDate from,
                                        LocalDate to);

        List<StudentDTO> findAll();
        StudentDTO findById(Long id);
        StudentDTO update(Long id, StudentDTO dto);
        void delete(Long id);
}
