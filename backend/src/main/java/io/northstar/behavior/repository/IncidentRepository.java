package io.northstar.behavior.repository;

import io.northstar.behavior.model.Incident;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface IncidentRepository extends JpaRepository<Incident, Long> {
    List<Incident> findByStudentIdOrderByOccurredAtDesc(long studentId);
}
