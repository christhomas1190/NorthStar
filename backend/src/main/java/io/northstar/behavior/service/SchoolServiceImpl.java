package io.northstar.behavior.service;

import io.northstar.behavior.dto.CreateSchoolRequest;
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
        return new SchoolDTO(
                s.getSchoolId(),
                s.getSchoolName(),
                s.getDistrict().getDistrictId()
        );
    }

    @Override
    public SchoolDTO create(Long districtId, CreateSchoolRequest req) {
        District d = districts.findById(districtId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "district missing"));

        School s = new School();
        s.setSchoolName(req.name());
        s.setDistrict(d);

        School saved = schools.save(s);
        return toDto(saved);
    }

    @Override
    public SchoolDTO createForDistrict(Long districtId, String name) {
        District d = districts.findById(districtId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "district not found"));
        School s = new School();
        s.setSchoolName(name);
        s.setDistrict(d);
        return toDto(schools.save(s));
    }

    @Override
    @Transactional(readOnly = true)
    public List<SchoolDTO> listByDistrict(Long districtId) {
        List<School> all = schools.findByDistrict_DistrictId(districtId); // << fixed
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
