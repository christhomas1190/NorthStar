package io.northstar.behavior.service;

import io.northstar.behavior.dto.BehaviorCategoryDTO;
import java.util.List;

public interface BehaviorCategoryService {
    BehaviorCategoryDTO create(BehaviorCategoryDTO dto);
    List<BehaviorCategoryDTO> findAll();
    BehaviorCategoryDTO findById(Long id);
    BehaviorCategoryDTO update(Long id, BehaviorCategoryDTO dto);
    void delete(Long id);
}
