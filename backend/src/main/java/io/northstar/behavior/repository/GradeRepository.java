package io.northstar.behavior.repository;

import io.northstar.behavior.model.Grade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GradeRepository extends JpaRepository<Grade, Long> {
    List<Grade> findByStudent_IdAndDistrict_DistrictId(Long studentId, Long districtId);
    Optional<Grade> findByStudent_IdAndAssignment_Id(Long studentId, Long assignmentId);
    List<Grade> findByAssignment_Id(Long assignmentId);
}
