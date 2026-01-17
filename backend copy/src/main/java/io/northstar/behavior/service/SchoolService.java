package io.northstar.behavior.service;

import io.northstar.behavior.dto.CreateSchoolRequest;
import io.northstar.behavior.dto.SchoolDTO;
import java.util.List;

public interface SchoolService {
    // districtId from path, body is CreateSchoolRequest
    SchoolDTO create(Long districtId, CreateSchoolRequest req);

    SchoolDTO createForDistrict(Long districtId, String name);

    List<SchoolDTO> listByDistrict(Long districtId);

    SchoolDTO findById(Long id);

    void delete(Long id);;
}
