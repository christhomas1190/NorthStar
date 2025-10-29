package io.northstar.behavior.repository;

import io.northstar.behavior.model.District;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DistrictRepository extends JpaRepository<District, Long> {
}
