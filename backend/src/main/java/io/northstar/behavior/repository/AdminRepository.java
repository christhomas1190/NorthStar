// src/main/java/io/northstar/behavior/repository/AdminRepository.java
package io.northstar.behavior.repository;

import io.northstar.behavior.model.Admin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdminRepository extends JpaRepository<Admin, Long> {
    boolean existsByEmailAndSchool_SchoolId(String email, Long schoolId);
    boolean existsByUserNameAndSchool_SchoolId(String userName, Long schoolId);

    List<Admin> findBySchoolId(Long schoolId);
}
