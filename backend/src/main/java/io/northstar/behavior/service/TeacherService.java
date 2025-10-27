package io.northstar.behavior.service;

import io.northstar.behavior.dto.TeacherDTO;

import java.util.List;

public interface TeacherService {
    TeacherDTO create(TeacherDTO dto);
    List<TeacherDTO> findAll();
    TeacherDTO findById(Long id);
    TeacherDTO update(Long id, TeacherDTO dto); // does NOT allow changing username directly
    void delete(Long id);
}
