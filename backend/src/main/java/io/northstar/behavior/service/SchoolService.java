package io.northstar.behavior.service;

import io.northstar.behavior.dto.SchoolDTO;
import java.util.List;

public interface SchoolService {
    SchoolDTO create(SchoolDTO dto);
    SchoolDTO createForDistrict(Long districtId, String name);
    List<SchoolDTO> listByDistrict(Long districtId);
    SchoolDTO findById(Long id);
    void delete(Long id);
}
