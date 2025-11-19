package io.northstar.behavior.service;

import io.northstar.behavior.dto.BehaviorCategoryDTO;
import io.northstar.behavior.dto.CreateBehaviorCategoryRequest;

import java.util.List;

public interface BehaviorCategoryService {

    // NEW: matches service.create(districtId, req)
    BehaviorCategoryDTO create(Long districtId, CreateBehaviorCategoryRequest req);

    // keep the rest as you already have them (adjust names if needed)
    List<BehaviorCategoryDTO> findAll();
    BehaviorCategoryDTO findById(Long id);
    BehaviorCategoryDTO update(Long id, BehaviorCategoryDTO dto);
    void delete(Long id);
}