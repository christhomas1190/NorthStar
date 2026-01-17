package io.northstar.behavior.repository;

import io.northstar.behavior.model.School;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SchoolRepository extends JpaRepository<School, Long> {
    List<School> findByDistrict_DistrictId(Long districtId); // << was findByDistrict_Id
}
