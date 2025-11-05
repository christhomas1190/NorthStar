package io.northstar.behavior.service;

import io.northstar.behavior.dto.SchoolDTO;
import io.northstar.behavior.model.District;
import io.northstar.behavior.model.School;
import io.northstar.behavior.repository.DistrictRepository;
import io.northstar.behavior.repository.SchoolRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class SchoolServiceImpl implements SchoolService {

    private final SchoolRepository schools;
    private final DistrictRepository districts;

    public SchoolServiceImpl(SchoolRepository schools, DistrictRepository districts) {
        this.schools = schools;
        this.districts = districts;
    }

    private static SchoolDTO toDto(School s) {
        return new SchoolDTO(s.getId(), s.getName(), s.getDistrict().getDistrictId());
    }

    @Override
    public SchoolDTO create(SchoolDTO dto) {
        District d = districts.findById(dto.districtId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "district not found"));
        School s = new School();
        s.setName(dto.name());
        s.setDistrict(d);
        return toDto(schools.save(s));
    }

    @Override
    public SchoolDTO createForDistrict(Long districtId, String name) {
        District d = districts.findById(districtId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "district not found"));
        School s = new School();
        s.setName(name);
        s.setDistrict(d);
        return toDto(schools.save(s));
    }

    @Override
    @Transactional(readOnly = true)
    public List<SchoolDTO> listByDistrict(Long districtId) {
        List<School> all = schools.findByDistrict_Id(districtId);
        List<SchoolDTO> out = new ArrayList<>();
        for (School s : all) out.add(toDto(s));
        return out;
    }

    @Override
    @Transactional(readOnly = true)
    public SchoolDTO findById(Long id) {
        School s = schools.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "school not found"));
        return toDto(s);
    }

    @Override
    public void delete(Long id) {
        if (!schools.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "school not found");
        schools.deleteById(id);
    }
}
