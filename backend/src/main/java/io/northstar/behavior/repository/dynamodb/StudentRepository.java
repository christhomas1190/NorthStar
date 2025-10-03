package io.northstar.behavior.repository.dynamodb;

import io.northstar.behavior.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface StudentRepository extends JpaRepository<Student, Long> {
    boolean existsByStudentId(String studentId);
    @Query("""
      SELECT s FROM Student s
      WHERE lower(s.firstName) LIKE concat('%', :q, '%')
         OR lower(s.lastName)  LIKE concat('%', :q, '%')
         OR lower(s.studentId) LIKE concat('%', :q, '%')
    """)
    List<Student> searchByNameOrStudentId(String q);
}
