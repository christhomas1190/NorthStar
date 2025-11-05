package io.northstar.behavior.service;

import io.northstar.behavior.dto.BehaviorCategoryDTO;
import io.northstar.behavior.model.BehaviorCategory;
import io.northstar.behavior.model.District;
import io.northstar.behavior.repository.BehaviorCategoryRepository;
import io.northstar.behavior.repository.DistrictRepository;
import io.northstar.behavior.tenant.TenantContext;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class BehaviorCategoryServiceImpl implements BehaviorCategoryService {

    private final BehaviorCategoryRepository repo;
    private final DistrictRepository districtRepo;

    public BehaviorCategoryServiceImpl(BehaviorCategoryRepository repo, DistrictRepository districtRepo) {
        this.repo = repo;
        this.districtRepo = districtRepo;
    }

    // ---- Mappers ------------------------------------------------------------

    private BehaviorCategoryDTO toDto(BehaviorCategory e) {
        return new BehaviorCategoryDTO(
                e.getId(),
                e.getName(),
                e.getSeverity(),
                e.getTier(),
                e.getDescription(),
                e.getCreatedAt(),
                e.getDistrict().getDistrictId()   // <-- 7th arg: districtId
        );
    }

    private void apply(BehaviorCategory e, BehaviorCategoryDTO d) {
        e.setName(d.name());
        e.setSeverity(d.severity());
        e.setTier(d.tier());
        e.setDescription(d.description());
    }

    // ---- Service methods ----------------------------------------------------

    @Override
    public BehaviorCategoryDTO create(BehaviorCategoryDTO dto) {
        Long districtId = TenantContext.getDistrictId();
        if (districtId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No district in context");
        if (dto == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "body is required");
        if (dto.name() == null || dto.name().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");

        // Optional duplicate check per district (add method in repo)
        // if (repo.existsByNameIgnoreCaseAndDistrict_DistrictId(dto.name().trim(), districtId)) {
        //     throw new ResponseStatusException(HttpStatus.CONFLICT, "category already exists");
        // }

        BehaviorCategory entity = new BehaviorCategory();
        apply(entity, dto);
        entity.setCreatedAt(OffsetDateTime.now());

        District d = districtRepo.getReferenceById(districtId);
        entity.setDistrict(d);

        BehaviorCategory saved = repo.save(entity);
        return toDto(saved);
    }

    @Override
    public List<BehaviorCategoryDTO> findAll() {
        Long districtId = TenantContext.getDistrictId();
        if (districtId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No district in context");

        // Prefer a scoped repo method if you added it:
        // List<BehaviorCategory> list = repo.findByDistrict_DistrictId(districtId);
        List<BehaviorCategory> list = repo.findAll(); // fallback if you haven't added the method yet

        List<BehaviorCategoryDTO> out = new ArrayList<>();
        for (int i = 0; i < list.size(); i++) {
            BehaviorCategory e = list.get(i);
            // If you didn't implement a scoped repo method, filter here:
            if (e.getDistrict() != null && e.getDistrict().getDistrictId().equals(districtId)) {
                out.add(toDto(e));
            }
        }
        return out;
    }

    @Override
    public BehaviorCategoryDTO findById(Long id) {
        Long districtId = TenantContext.getDistrictId();
        if (districtId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No district in context");

        // Prefer a scoped repo method:
        // BehaviorCategory b = repo.findByIdAndDistrict_DistrictId(id, districtId)
        //        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "not found"));

        BehaviorCategory b = repo.findById(id)
                .filter(e -> e.getDistrict() != null && e.getDistrict().getDistrictId().equals(districtId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "not found"));

        return toDto(b);
    }

    @Override
    public BehaviorCategoryDTO update(Long id, BehaviorCategoryDTO dto) {
        Long districtId = TenantContext.getDistrictId();
        if (districtId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No district in context");

        // Prefer a scoped repo method:
        // BehaviorCategory b = repo.findByIdAndDistrict_DistrictId(id, districtId)
        //        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "not found"));

        BehaviorCategory b = repo.findById(id)
                .filter(e -> e.getDistrict() != null && e.getDistrict().getDistrictId().equals(districtId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "not found"));

        apply(b, dto);
        return toDto(b); // managed entity; no explicit save required in @Transactional
    }

    @Override
    public void delete(Long id) {
        Long districtId = TenantContext.getDistrictId();
        if (districtId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No district in context");

        // Prefer scoped repo:
        // BehaviorCategory b = repo.findByIdAndDistrict_DistrictId(id, districtId)
        //        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "not found"));

        BehaviorCategory b = repo.findById(id)
                .filter(e -> e.getDistrict() != null && e.getDistrict().getDistrictId().equals(districtId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "not found"));

        repo.delete(b);
    }
}
