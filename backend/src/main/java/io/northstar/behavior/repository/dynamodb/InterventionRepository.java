package io.northstar.behavior.repository.dynamodb;

import io.northstar.behavior.model.Intervention;
import org.hibernate.query.Page;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;


public interface InterventionRepository extends JpaRepository<Intervention, Long> {
    List<Intervention> findStudentByIdOrderByOccuredAtDesc(long studentId);
}
