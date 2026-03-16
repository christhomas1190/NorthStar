package io.northstar.behavior.repository;

import io.northstar.behavior.model.TierChangeEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TierChangeEventRepository extends JpaRepository<TierChangeEvent, Long> {
    List<TierChangeEvent> findByStudent_IdOrderByChangedAtDesc(Long studentId);
    List<TierChangeEvent> findByDistrict_DistrictIdOrderByChangedAtDesc(Long districtId);
}
