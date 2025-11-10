package io.northstar.behavior.repository;

import io.northstar.behavior.model.BehaviorCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BehaviorCategoryRepository extends JpaRepository<BehaviorCategory, Long> {
    List<BehaviorCategory> findByDistrict_DistrictId(Long districtId);
}