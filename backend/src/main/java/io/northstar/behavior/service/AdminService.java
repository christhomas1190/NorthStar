package io.northstar.behavior.service;

import io.northstar.behavior.dto.AdminDTO;
import io.northstar.behavior.model.Admin;

import java.util.List;
import java.util.Optional;

public interface AdminService {
    AdminDTO create(AdminDTO dto);
    List<AdminDTO> findAll();
    AdminDTO findById(Long id);
    AdminDTO update(Long id, AdminDTO dto);
    void delete(Long id);
    Optional<Admin> findByUserName(String userName);
}
