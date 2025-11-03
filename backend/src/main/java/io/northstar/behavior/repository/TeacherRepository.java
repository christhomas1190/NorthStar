// src/main/java/io/northstar/behavior/repository/TeacherRepository.java
package io.northstar.behavior.repository;

import io.northstar.behavior.model.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TeacherRepository extends JpaRepository<Teacher, Long> {

    Optional<Teacher> findByEmail(String email);

    // Used by TeacherServiceImpl
    boolean existsByEmail(String email);

    // Used by TeacherServiceImpl
    boolean existsByUsername(String username);
}
