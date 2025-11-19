package io.northstar.behavior.repository;

import io.northstar.behavior.model.BehaviorCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BehaviorCategoryRepository extends JpaRepository<BehaviorCategory, Long> {

    // All categories for a district
    List<BehaviorCategory> findByDistrict_DistrictId(Long districtId);

    // (Optionally) narrow to a school as well
    List<BehaviorCategory> findByDistrict_DistrictIdAndSchool_SchoolId(Long districtId, Long schoolId);
}