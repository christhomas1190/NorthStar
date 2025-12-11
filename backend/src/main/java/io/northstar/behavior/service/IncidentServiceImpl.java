// src/main/java/io/northstar/behavior/service/IncidentServiceImpl.java
package io.northstar.behavior.service;

import io.northstar.behavior.dto.CreateIncidentRequest;
import io.northstar.behavior.dto.IncidentDTO;
import io.northstar.behavior.dto.IncidentSummaryDTO;
import io.northstar.behavior.model.Incident;
import io.northstar.behavior.model.Student;
import io.northstar.behavior.repository.IncidentRepository;
import io.northstar.behavior.repository.StudentRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class IncidentServiceImpl implements IncidentService {

    private final IncidentRepository incidents;
    private final StudentRepository students;

    public IncidentServiceImpl(IncidentRepository incidents, StudentRepository students) {
        this.incidents = incidents;
        this.students = students;
    }

    // ---------- Mapping helpers ----------

    private IncidentDTO toDto(Incident inc) {
        long id  = (inc.getId() != null) ? inc.getId() : 0L;
        long sid = (inc.getStudentId() != null) ? inc.getStudentId() : 0L;
        Long did = (inc.getDistrict() != null) ? inc.getDistrict().getDistrictId() : null;

        return new IncidentDTO(
                id,
                sid,
                inc.getCategory(),
                inc.getDescription(),
                inc.getSeverity(),
                inc.getReportedBy(),
                inc.getOccurredAt(),
                inc.getCreatedAt(),
                did
        );
    }

    private long countRecentIncidentsForStudent(Long studentId, int windowDays) {
        List<Incident> all = incidents.findByStudentIdOrderByOccurredAtDesc(studentId);
        OffsetDateTime cutoff = OffsetDateTime.now().minusDays(windowDays);

        long count = 0;
        for (Incident incident : all) {
            if (incident.getOccurredAt().isBefore(cutoff)) {
                // they're sorted desc, so once we're past the window we can stop
                break;
            }
            count++;
        }
        return count;
    }

    // ---------- Top-level create/find methods ----------

    @Override
    public IncidentDTO create(CreateIncidentRequest req) {
        Student s = students.findById(req.studentId())
                .orElseThrow(() -> new EntityNotFoundException("Student " + req.studentId() + " not found"));

        Incident inc = new Incident();
        inc.setStudent(s);
        inc.setStudentId(s.getId());
        inc.setDistrict(s.getDistrict());
        inc.setSchool(s.getSchool()); // tie to the student's school
        inc.setCategory(req.category());
        inc.setDescription(req.description());
        inc.setSeverity(req.severity());
        inc.setReportedBy(req.reportedBy());
        inc.setOccurredAt(req.occurredAt() != null ? req.occurredAt() : OffsetDateTime.now());
        inc.setCreatedAt(OffsetDateTime.now());

        return toDto(incidents.save(inc));
    }

    @Override
    @Transactional(readOnly = true)
    public List<IncidentDTO> findAll() {
        List<Incident> list = incidents.findAll();
        List<IncidentDTO> out = new ArrayList<>();
        for (Incident i : list) {
            out.add(toDto(i));
        }
        return out;
    }

    @Override
    @Transactional(readOnly = true)
    public IncidentDTO findById(Long id) {
        Incident i = incidents.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Incident " + id + " not found"));
        return toDto(i);
    }

    @Override
    @Transactional(readOnly = true)
    public List<IncidentSummaryDTO> summaryForStudent(Long studentId) {
        List<Incident> list = incidents.findByStudentIdOrderByOccurredAtDesc(studentId);
        List<IncidentSummaryDTO> out = new ArrayList<>();
        for (Incident i : list) {
            long id = (i.getId() != null) ? i.getId() : 0L;
            Long did = (i.getDistrict() != null) ? i.getDistrict().getDistrictId() : null;

            out.add(new IncidentSummaryDTO(
                    id,
                    i.getCategory(),
                    i.getSeverity(),
                    i.getOccurredAt(),
                    did
            ));
        }
        return out;
    }

    @Override
    public void delete(Long id) {
        incidents.deleteById(id);
    }

    // ---------- Student-scoped methods (district-aware) ----------

    @Override
    @Transactional(readOnly = true)
    public List<IncidentDTO> listForStudent(Long studentId, Long districtId) {
        // Load the student and enforce district boundary
        Student s = students.findById(studentId)
                .orElseThrow(() -> new EntityNotFoundException("Student " + studentId + " not found"));

        if (s.getDistrict() == null || !s.getDistrict().getDistrictId().equals(districtId)) {
            throw new EntityNotFoundException(
                    "Student " + studentId + " not found in district " + districtId
            );
        }

        List<Incident> list = incidents.findByStudentIdOrderByOccurredAtDesc(studentId);
        List<IncidentDTO> out = new ArrayList<>();
        for (Incident i : list) {
            out.add(toDto(i));
        }
        return out;
    }

    @Override
    public IncidentDTO createForStudent(Long studentId, Long districtId, CreateIncidentRequest req) {
        Student s = students.findById(studentId)
                .orElseThrow(() -> new EntityNotFoundException("Student " + studentId + " not found"));

        if (s.getDistrict() == null || !s.getDistrict().getDistrictId().equals(districtId)) {
            throw new EntityNotFoundException(
                    "Student " + studentId + " not found in district " + districtId
            );
        }

        Incident inc = new Incident();
        inc.setStudent(s);
        inc.setStudentId(s.getId());
        inc.setDistrict(s.getDistrict());
        inc.setSchool(s.getSchool());
        inc.setCategory(req.category());
        inc.setDescription(req.description());
        inc.setSeverity(req.severity());
        inc.setReportedBy(req.reportedBy());
        inc.setOccurredAt(req.occurredAt() != null ? req.occurredAt() : OffsetDateTime.now());
        inc.setCreatedAt(OffsetDateTime.now());

        return toDto(incidents.save(inc));
    }
}
