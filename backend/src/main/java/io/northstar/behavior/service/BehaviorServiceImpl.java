package io.northstar.behavior.service;

import io.northstar.behavior.model.BehaviorCategory;
import io.northstar.behavior.repository.BehaviorCategoryRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class BehaviorServiceImpl implements BehaviorCategoryService {

    private final BehaviorCategoryRepository repo;

    public BehaviorServiceImpl(BehaviorCategoryRepository repo) {
        this.repo = repo;
    }

    @Override
    public BehaviorCategory create(String name, String severity, String tier, String description) {
        return repo.save(new BehaviorCategory(name, severity, tier, description));
    }

    @Override
    public List<BehaviorCategory> list() {
        return repo.findAll();
    }

    @Override
    public BehaviorCategory getById(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Behavior category not found: " + id));
    }

    @Override
    public BehaviorCategory update(Long id, String name, String severity, String tier, String description) {
        BehaviorCategory existing = getById(id);
        existing.setName(name);
        existing.setSeverity(severity);
        existing.setTier(tier);
        existing.setDescription(description);
        return repo.save(existing);
    }

    @Override
    public void delete(Long id) {
        repo.deleteById(id);
    }
}
