package io.northstar.behavior.service;

import io.northstar.behavior.model.BehaviorCategory;
import java.util.List;

public interface BehaviorCategoryService {

    BehaviorCategory create(String name, String severity, String tier, String description);

    List<BehaviorCategory> list();

    BehaviorCategory getById(Long id);

    BehaviorCategory update(Long id, String name, String severity, String tier, String description);

    void delete(Long id);

    Object update(Long id, InterventionController dto);
}
