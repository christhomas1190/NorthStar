package io.northstar.behavior.repository;

import io.northstar.behavior.model.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentRepository extends JpaRepository<Student, Long> {

    Page<Student> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCaseOrStudentIdContainingIgnoreCase(
            String firstName, String lastName, String studentId, Pageable pageable
    );
}
