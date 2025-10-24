package io.northstar.behavior.repository;

import io.northstar.behavior.model.Incident;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IncidentRepository extends JpaRepository<Incident, Long> {
    List<Incident> findByStudentIdOrderByOccurredAtDesc(Long studentId); // primary
    // keep this for backward compatibility if used anywhere:
    List<Incident> findByStudent_Id(Long studentId);
}
