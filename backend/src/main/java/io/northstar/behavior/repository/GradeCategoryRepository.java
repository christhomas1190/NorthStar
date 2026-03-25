package io.northstar.behavior.repository;

import io.northstar.behavior.model.GradeCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GradeCategoryRepository extends JpaRepository<GradeCategory, Long> {
    List<GradeCategory> findByTeacher_IdAndDistrict_DistrictId(Long teacherId, Long districtId);
    Optional<GradeCategory> findByTeacher_IdAndName(Long teacherId, String name);
    boolean existsByTeacher_IdAndName(Long teacherId, String name);
}
