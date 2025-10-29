package io.northstar.behavior.service;

import io.northstar.behavior.dto.AdminDTO;

import java.util.List;

public interface AdminService {
    AdminDTO create(AdminDTO dto);
    List<AdminDTO> findAll();
    AdminDTO findById(Long id);
    AdminDTO update(Long id, AdminDTO dto);
    void delete(Long id);
}
