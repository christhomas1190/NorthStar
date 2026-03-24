package io.northstar.behavior.repository;

import io.northstar.behavior.model.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeacherRepository extends JpaRepository<Teacher, Long> {

    Optional<Teacher> findByEmail(String email);
    Optional<Teacher> findByUserName(String userName);

    boolean existsByEmail(String email);
    boolean existsByUserName(String userName);
    boolean existsByUserNameAndSchool_SchoolId(String userName, Long schoolId);
    List<Teacher> findByDistrict_DistrictId(Long districtId);
}
