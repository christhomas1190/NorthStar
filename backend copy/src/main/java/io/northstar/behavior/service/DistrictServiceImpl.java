package io.northstar.behavior.service;

import io.northstar.behavior.dto.DistrictDTO;
import io.northstar.behavior.model.District;
import io.northstar.behavior.repository.DistrictRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class DistrictServiceImpl implements DistrictService {

    private final DistrictRepository repo;

    public DistrictServiceImpl(DistrictRepository repo) {
        this.repo = repo;
    }

    private String toSlug(String name) {
        String base = Normalizer.normalize(name, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return base.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
    }

    private DistrictDTO toDto(District d){
        return new DistrictDTO(
                d.getDistrictId(),
                d.getDistrictName()
        );
    }

    private void apply(District d, DistrictDTO dto){
        if (dto.districtName() != null && !dto.districtName().isBlank()) {
            d.setDistrictName(dto.districtName().trim());
            d.setSlug(toSlug(dto.districtName().trim()));
        }
    }

    @Override
    public DistrictDTO create(DistrictDTO dto) {
        if (dto == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "body is required");
        }
        if (dto.districtName() == null || dto.districtName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "district name required");
        }
        String name = dto.districtName().trim();
        if (repo.existsByDistrictName(name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "district already exists");
        }

        District d = new District();
        d.setDistrictName(name);
        d.setSlug(toSlug(name)); // ensure required

        District saved = repo.save(d);
        return toDto(saved);
    }

    @Override
    public List<DistrictDTO> findAll() {
        List<District> all = repo.findAll();
        List<DistrictDTO> out = new ArrayList<>();
        for (int i = 0; i < all.size(); i++) {
            out.add(toDto(all.get(i)));
        }
        return out;
    }

    @Override
    public DistrictDTO findDistrict(Long id) {
        District d = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "district not found"));
        return toDto(d);
    }

    @Override
    public DistrictDTO update(Long id, DistrictDTO dto) {
        District d = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "district not found"));
        apply(d, dto);
        return toDto(d);
    }

    @Override
    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "district not found");
        }
        repo.deleteById(id);
    }
}
