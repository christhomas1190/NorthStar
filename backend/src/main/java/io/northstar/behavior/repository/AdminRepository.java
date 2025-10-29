package io.northstar.behavior.repository;

import io.northstar.behavior.model.Admin;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminRepository extends JpaRepository<Admin,Long> {
    boolean getEmail(String email);
    boolean getUserName(String username);
}
