package io.northstar.behavior.repository;

import io.northstar.behavior.model.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    List<Assignment> findByTeacher_IdAndDistrict_DistrictId(Long teacherId, Long districtId);
    List<Assignment> findByCategory_Id(Long categoryId);
}
