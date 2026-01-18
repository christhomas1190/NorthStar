package io.northstar.behavior.repository;

import io.northstar.behavior.model.Admin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AdminRepository extends JpaRepository<Admin, Long> {
    boolean existsByEmailAndSchool_SchoolId(String email, Long schoolId);
    boolean existsByUserNameAndSchool_SchoolId(String userName, Long schoolId);
    Optional<Admin> findByUserNameAndDistrict_DistrictId(String userName, Long districtId);

    List<Admin> findBySchool_SchoolId(Long schoolId);
    Optional<Admin> findByUserName(String userName);
}
