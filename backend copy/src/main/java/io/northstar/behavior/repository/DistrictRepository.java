package io.northstar.behavior.repository;

import io.northstar.behavior.model.District;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface DistrictRepository extends JpaRepository<District, Long> {
    boolean existsByDistrictName(String districtName);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select d from District d where d.districtId = :id")
    Optional<District> findByIdForUpdate(@Param("id") Long id);
}
