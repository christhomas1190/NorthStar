package io.northstar.behavior.repository;

import io.northstar.behavior.model.Incident;
import io.northstar.behavior.model.School;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.OffsetDateTime;
import java.util.List;

public interface IncidentRepository extends JpaRepository<Incident, Long> {
    List<Incident> findByStudentIdOrderByOccurredAtDesc(Long studentId);

    List<Incident> findBySchoolAndOccurredAtBetween(
            School school,
            OffsetDateTime start,
            OffsetDateTime end
    );
    // Total cautions (incidents) entered by a teacher
    long countByReportedBy(String reportedBy);

    // Most common category entered by a teacher
    @Query("""
        select i.category, count(i)
        from Incident i
        where i.reportedBy = ?1
        group by i.category
        order by count(i) desc
    """)
    List<Object[]> topCategoriesForTeacher(String reportedBy);

    // Most cautioned student entered by a teacher
    @Query("""
        select i.student.id, i.student.firstName, i.student.lastName, count(i)
        from Incident i
        where i.reportedBy = ?1
        group by i.student.id, i.student.firstName, i.student.lastName
        order by count(i) desc
    """)
    List<Object[]> topStudentsForTeacher(String reportedBy);
}
