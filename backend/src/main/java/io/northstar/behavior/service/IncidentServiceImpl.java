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

    @Override
    public IncidentDTO create(CreateIncidentRequest req) {
        // ensure student exists
        Student s = students.findById(req.studentId())
                .orElseThrow(() -> new EntityNotFoundException("Student " + req.studentId() + " not found"));

        Incident inc = new Incident();
        inc.setStudent(s);
        inc.setStudentId(s.getId());           // if you also store the FK separately
        inc.setCategory(req.category());
        inc.setDescription(req.description());
        inc.setSeverity(req.severity());
        inc.setReportedBy(req.reportedBy());
        inc.setOccurredAt(req.occurredAt() != null ? req.occurredAt() : OffsetDateTime.now());
        inc.setCreatedAt(OffsetDateTime.now());

        Incident saved = incidents.save(inc);
        return toDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<IncidentDTO> findAll() {
        List<Incident> list = incidents.findAll();
        List<IncidentDTO> out = new ArrayList<>();
        for (Incident i : list) out.add(toDTO(i));
        return out;
    }

    @Override
    @Transactional(readOnly = true)
    public IncidentDTO findById(Long id) {
        Incident i = incidents.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Incident " + id + " not found"));
        return toDTO(i);
    }

    @Override
    @Transactional(readOnly = true)
    public List<IncidentSummaryDTO> summaryForStudent(Long studentId) {
        List<Incident> list = incidents.findByStudentIdOrderByOccurredAtDesc(studentId);
        List<IncidentSummaryDTO> out = new ArrayList<>();
        for (Incident i : list) {
            out.add(new IncidentSummaryDTO(
                    i.getId(),
                    i.getCategory(),
                    i.getSeverity(),
                    i.getOccurredAt()
            ));
        }
        return out;
    }

    @Override
    public void delete(Long id) {
        incidents.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Incident> listForStudent(Long studentId) {
        return incidents.findByStudentIdOrderByOccurredAtDesc(studentId);
    }

    // ---- mapper
    private IncidentDTO toDTO(Incident inc) {
        return new IncidentDTO(
                inc.getId(),
                inc.getStudentId(),
                inc.getCategory(),
                inc.getDescription(),
                inc.getSeverity(),
                inc.getReportedBy(),
                inc.getOccurredAt(),
                inc.getCreatedAt()
        );
    }
    @Override
    public IncidentDTO createForStudent(Long studentId, CreateIncidentRequest req) {
        Student s = students.findById(studentId)
                .orElseThrow(() -> new EntityNotFoundException("Student " + studentId + " not found"));

        Incident inc = new Incident();
        inc.setStudent(s);
        inc.setStudentId(s.getId());
        inc.setCategory(req.category());
        inc.setDescription(req.description());
        inc.setSeverity(req.severity());
        inc.setReportedBy(req.reportedBy());
        inc.setOccurredAt(req.occurredAt() != null ? req.occurredAt() : OffsetDateTime.now());
        inc.setCreatedAt(OffsetDateTime.now());

        Incident saved = incidents.save(inc);
        return toDTO(saved);
    }

}
