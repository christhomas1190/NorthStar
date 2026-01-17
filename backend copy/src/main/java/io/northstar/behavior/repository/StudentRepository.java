package io.northstar.behavior.repository;

import io.northstar.behavior.model.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    List<Student> findByDistrict_DistrictId(Long districtId);
    Optional<Student> findByIdAndDistrict_DistrictId(Long id, Long districtId);
    boolean existsByStudentIdAndDistrict_DistrictId(String studentId, Long districtId);

}
