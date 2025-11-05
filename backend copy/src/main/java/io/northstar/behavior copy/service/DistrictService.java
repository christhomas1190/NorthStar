package io.northstar.behavior.service;

import io.northstar.behavior.dto.DistrictDTO;

import java.util.List;

public interface DistrictService {
    DistrictDTO create (DistrictDTO req);
    DistrictDTO findDistrict (Long req);
    List<DistrictDTO> findAll();
    void delete(Long id);
    DistrictDTO update(Long id, DistrictDTO dto);

}
