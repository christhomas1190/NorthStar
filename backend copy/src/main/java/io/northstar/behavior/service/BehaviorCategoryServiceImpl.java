package io.northstar.behavior.service;

import io.northstar.behavior.dto.BehaviorCategoryDTO;
import io.northstar.behavior.dto.CreateBehaviorCategoryRequest;
import io.northstar.behavior.model.BehaviorCategory;
import io.northstar.behavior.model.District;
import io.northstar.behavior.model.School;
import io.northstar.behavior.repository.BehaviorCategoryRepository;
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
public class BehaviorCategoryServiceImpl implements BehaviorCategoryService {

    private final BehaviorCategoryRepository categories;
    private final DistrictRepository districts;
    private final SchoolRepository schools;

    public BehaviorCategoryServiceImpl(
            BehaviorCategoryRepository categories,
            DistrictRepository districts,
            SchoolRepository schools
    ) {
        this.categories = categories;
        this.districts = districts;
        this.schools = schools;
    }

    // ---------- helpers ----------

    private static BehaviorCategoryDTO toDto(BehaviorCategory e) {
        return new BehaviorCategoryDTO(
                e.getId(),
                e.getName(),
                e.getDescription(),
                e.getTier(),
                e.getSeverity(),
                e.getSchool() != null ? e.getSchool().getSchoolId() : null,
                e.getDistrict() != null ? e.getDistrict().getDistrictId() : null
        );
    }

    private static void applyFromDto(BehaviorCategory e, BehaviorCategoryDTO dto) {
        e.setName(dto.name());
        e.setDescription(dto.description());
        e.setTier(dto.tier());
        e.setSeverity(dto.severity());
    }

    // ---------- create using districtId + request ----------

    @Override
    public BehaviorCategoryDTO create(Long districtId, CreateBehaviorCategoryRequest req) {
        if (districtId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "districtId is required");
        }
        if (req.schoolId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "schoolId is required");
        }

        District d = districts.findById(districtId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "District not found"));

        School s = schools.findById(req.schoolId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "School not found"));

        if (!s.getDistrict().getDistrictId().equals(districtId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "School does not belong to this district");
        }

        BehaviorCategory e = new BehaviorCategory();
        e.setName(req.name());
        e.setDescription(req.description());
        e.setTier(req.tier());
        e.setSeverity(req.severity());
        e.setDistrict(d);
        e.setSchool(s);

        BehaviorCategory saved = categories.save(e);
        return toDto(saved);
    }

    // ---------- read/list/update/delete using existing style ----------

    @Override
    @Transactional(readOnly = true)
    public List<BehaviorCategoryDTO> findAll() {
        // If you want this per-district, you can add a districtId param and call
        // categories.findByDistrict_DistrictId(districtId)
        List<BehaviorCategory> all = categories.findAll();
        List<BehaviorCategoryDTO> out = new ArrayList<>();
        for (BehaviorCategory e : all) {
            out.add(toDto(e));
        }
        return out;
    }

    @Override
    @Transactional(readOnly = true)
    public BehaviorCategoryDTO findById(Long id) {
        BehaviorCategory e = categories.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Behavior category not found"));
        return toDto(e);
    }

    @Override
    public BehaviorCategoryDTO update(Long id, BehaviorCategoryDTO dto) {
        BehaviorCategory e = categories.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Behavior category not found"));

        applyFromDto(e, dto);
        BehaviorCategory saved = categories.save(e);
        return toDto(saved);
    }

    @Override
    public void delete(Long id) {
        if (!categories.existsById(id)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Behavior category not found");
        }
        categories.deleteById(id);
    }
}