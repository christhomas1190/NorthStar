package io.northstar.behavior.repository.dynamodb;

import io.northstar.behavior.model.Incident;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface IncidentRepository extends JpaRepository<Incident, Long> {
    List<Incident> findStudentByIdOrderByOccuredAtDesc(long studentId);
}
