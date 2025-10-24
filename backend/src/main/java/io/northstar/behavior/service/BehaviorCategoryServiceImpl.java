package io.northstar.behavior.service;

import io.northstar.behavior.dto.BehaviorCategoryDTO;
import io.northstar.behavior.model.BehaviorCategory;
import io.northstar.behavior.repository.BehaviorCategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class BehaviorCategoryServiceImpl implements BehaviorCategoryService {

    private final BehaviorCategoryRepository repo;

    public BehaviorCategoryServiceImpl(BehaviorCategoryRepository repo) {
        this.repo = repo;
    }

    @Override
    public BehaviorCategoryDTO create(BehaviorCategoryDTO dto) {
        BehaviorCategory entity = new BehaviorCategory();
        entity.setName(dto.name());
        entity.setSeverity(dto.severity());
        entity.setTier(dto.tier());
        entity.setDescription(dto.description());
        entity.setCreatedAt(OffsetDateTime.now());

        BehaviorCategory saved = repo.save(entity);
        return new BehaviorCategoryDTO(
                saved.getId(),
                saved.getName(),
                saved.getSeverity(),
                saved.getTier(),
                saved.getDescription(),
                saved.getCreatedAt()
        );
    }

    @Override
    public List<BehaviorCategoryDTO> findAll() {
        return repo.findAll().stream()
                .map(b -> new BehaviorCategoryDTO(
                        b.getId(),
                        b.getName(),
                        b.getSeverity(),
                        b.getTier(),
                        b.getDescription(),
                        b.getCreatedAt()))
                .collect(Collectors.toList());
    }

    @Override
    public BehaviorCategoryDTO findById(Long id) {
        BehaviorCategory b = repo.findById(id).orElseThrow();
        return new BehaviorCategoryDTO(
                b.getId(), b.getName(), b.getSeverity(),
                b.getTier(), b.getDescription(), b.getCreatedAt()
        );
    }

    @Override
    public BehaviorCategoryDTO update(Long id, BehaviorCategoryDTO dto) {
        BehaviorCategory b = repo.findById(id).orElseThrow();
        b.setName(dto.name());
        b.setSeverity(dto.severity());
        b.setTier(dto.tier());
        b.setDescription(dto.description());
        BehaviorCategory saved = repo.save(b);
        return new BehaviorCategoryDTO(
                saved.getId(), saved.getName(), saved.getSeverity(),
                saved.getTier(), saved.getDescription(), saved.getCreatedAt()
        );
    }

    @Override
    public void delete(Long id) {
        repo.deleteById(id);
    }
}
