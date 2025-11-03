package io.northstar.behavior.repository;

import io.northstar.behavior.model.Admin;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminRepository extends JpaRepository<Admin, Long> {
    boolean existsByEmail(String email);
    boolean existsByUserNameAndDistrict_DistrictId(String userName, Long districtId);
}
