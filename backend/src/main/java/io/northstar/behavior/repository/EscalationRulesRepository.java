package io.northstar.behavior.repository;

import io.northstar.behavior.model.EscalationRules;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EscalationRulesRepository extends JpaRepository<EscalationRules, Long> {
  Optional<EscalationRules> findByDistrict_DistrictIdAndSchool_SchoolId(Long districtId, Long schoolId);
  Optional<EscalationRules> findByDistrict_DistrictIdAndSchoolIsNull(Long districtId);

}
