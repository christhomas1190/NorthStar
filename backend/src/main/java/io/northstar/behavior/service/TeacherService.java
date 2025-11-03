package io.northstar.behavior.service;

import io.northstar.behavior.dto.TeacherDTO;

import java.util.List;

public interface TeacherService {
    TeacherDTO create(TeacherDTO dto);
    TeacherDTO update(Long id, TeacherDTO dto);
    void delete(Long id);
    TeacherDTO findById(Long id);
    List<TeacherDTO> findAll();
}