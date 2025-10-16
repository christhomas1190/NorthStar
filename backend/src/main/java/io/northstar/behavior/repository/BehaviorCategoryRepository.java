package io.northstar.behavior.repository;

import io.northstar.behavior.model.BehaviorCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BehaviorCategoryRepository extends JpaRepository<BehaviorCategory, Long> { }
