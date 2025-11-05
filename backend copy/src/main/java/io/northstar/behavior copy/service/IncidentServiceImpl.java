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

    @Override
    public IncidentDTO create(CreateIncidentRequest req) {
        Student s = students.findById(req.studentId())
                .orElseThrow(() -> new EntityNotFoundException("Student " + req.studentId() + " not found"));

        Incident inc = new Incident();
        inc.setStudent(s);
        inc.setStudentId(s.getId());
        inc.setDistrict(s.getDistrict());
        inc.setCategory(req.category());
        inc.setDescription(req.description());
        inc.setSeverity(req.severity());
        inc.setReportedBy(req.reportedBy());
        inc.setOccurredAt(req.occurredAt() != null ? req.occurredAt() : OffsetDateTime.now());
        inc.setCreatedAt(OffsetDateTime.now());

        return toDto(incidents.save(inc));
    }

    @Override @Transactional(readOnly = true)
    public List<IncidentDTO> findAll() {
        List<Incident> list = incidents.findAll();
        List<IncidentDTO> out = new ArrayList<>();
        for (Incident i : list) out.add(toDto(i));
        return out;
    }

    @Override @Transactional(readOnly = true)
    public IncidentDTO findById(Long id) {
        Incident i = incidents.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Incident " + id + " not found"));
        return toDto(i);
    }

    @Override @Transactional(readOnly = true)
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
    public void delete(Long id) { incidents.deleteById(id); }

    @Override @Transactional(readOnly = true)
    public List<Incident> listForStudent(Long studentId) {
        return incidents.findByStudentIdOrderByOccurredAtDesc(studentId);
    }

    @Override
    public IncidentDTO createForStudent(Long studentId, CreateIncidentRequest req) {
        Student s = students.findById(studentId)
                .orElseThrow(() -> new EntityNotFoundException("Student " + studentId + " not found"));

        Incident inc = new Incident();
        inc.setStudent(s);
        inc.setStudentId(s.getId());
        inc.setDistrict(s.getDistrict());
        inc.setCategory(req.category());
        inc.setDescription(req.description());
        inc.setSeverity(req.severity());
        inc.setReportedBy(req.reportedBy());
        inc.setOccurredAt(req.occurredAt() != null ? req.occurredAt() : OffsetDateTime.now());
        inc.setCreatedAt(OffsetDateTime.now());

        return toDto(incidents.save(inc));
    }
}
