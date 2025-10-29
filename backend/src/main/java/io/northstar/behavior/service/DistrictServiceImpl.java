package io.northstar.behavior.service;

import io.northstar.behavior.dto.*;
import io.northstar.behavior.model.*;
import io.northstar.behavior.repository.AdminRepository;
import io.northstar.behavior.repository.DistrictRepository;
import io.northstar.behavior.repository.IncidentRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;


@Service
@Transactional
public class DistrictServiceImpl {

    private final DistrictRepository repo;

    public DistrictServiceImpl(DistrictRepository repo) {
        this.repo = repo;
    }
    private DistrictDTO toDto(District d){
        return new DistrictDTO(
                d.getDistrictId(),
                d.getDistrictName()
        );
    }

    public DistrictDTO create(DistrictDTO dto) {
        if (dto == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "body is required");
        }
        if (dto.districtName() == null || dto.districtName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "district name required");
        }


        District d = new District();
        d.setDistrictName(dto.districtName().trim());

        District saved = repo.save(d);
        return toDto(saved);
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "District not found");
        }
        repo.deleteById(id);
    }

}
