package io.northstar.behavior.service;

import io.northstar.behavior.dto.CreateIncidentRequest;
import io.northstar.behavior.dto.DistrictDTO;

import java.util.List;

public interface DistrictService {
    DistrictDTO create (DistrictDTO req);
    DistrictDTO findDistrict (DistrictDTO req);
    List<DistrictDTO> findAll();
    List<DistrictDTO> summaryOfDistricts(Long districtId);
    List<DistrictDTO> listOfSchoolsInDistrict(Long nameOfSchools);

    void delete(Long id);

    DistrictDTO update(Long id, DistrictDTO dto);
}
