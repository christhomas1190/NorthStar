package io.northstar.behavior.repository;

import io.northstar.behavior.model.Intervention;
import org.hibernate.query.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterventionRepository extends JpaRepository<Intervention, Long> {
    List<Intervention> findByStudent_IdOrderByStartDateDesc(Long studentId);
}
