package io.northstar.behavior.repository;

import io.northstar.behavior.model.Incident;
import io.northstar.behavior.model.School;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.List;

public interface IncidentRepository extends JpaRepository<Incident, Long> {
    List<Incident> findByStudentIdOrderByOccurredAtDesc(Long studentId);

    List<Incident> findBySchoolAndOccurredAtBetween(
            School school,
            OffsetDateTime start,
            OffsetDateTime end
    );
}
