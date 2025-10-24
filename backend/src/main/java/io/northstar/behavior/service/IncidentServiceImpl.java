package io.northstar.behavior.service;

import io.northstar.behavior.dto.CreateIncidentRequest;
import io.northstar.behavior.dto.IncidentDTO;
import io.northstar.behavior.dto.IncidentSummaryDTO;
import io.northstar.behavior.model.Incident;
import io.northstar.behavior.repository.IncidentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class IncidentServiceImpl implements IncidentService {

    private final IncidentRepository incidentRepo;

    public IncidentServiceImpl(IncidentRepository incidentRepo) {
        this.incidentRepo = incidentRepo;
    }

    @Override
    public IncidentDTO create(CreateIncidentRequest req) {
        Incident i = new Incident();
        i.setStudentId(req.studentId());
        i.setCategory(req.category());
        i.setDescription(req.description());
        i.setSeverity(req.severity());
        i.setReportedBy(req.reportedBy());
        i.setOccurredAt(req.occurredAt());
        i.setCreatedAt(OffsetDateTime.now());

        Incident saved = incidentRepo.save(i);
        return new IncidentDTO(
                saved.getId(),
                saved.getStudentId(),
                saved.getCategory(),
                saved.getDescription(),
                saved.getSeverity(),
                saved.getReportedBy(),
                saved.getOccurredAt(),
                saved.getCreatedAt()
        );
    }

    @Override
    public List<IncidentDTO> findAll() {
        List<IncidentDTO> list = new ArrayList<>();
        for (Incident i : incidentRepo.findAll()) {
            list.add(new IncidentDTO(
                    i.getId(), i.getStudentId(), i.getCategory(), i.getDescription(),
                    i.getSeverity(), i.getReportedBy(), i.getOccurredAt(), i.getCreatedAt()
            ));
        }
        return list;
    }

    @Override
    public IncidentDTO findById(Long id) {
        Incident i = incidentRepo.findById(id).orElseThrow();
        return new IncidentDTO(
                i.getId(), i.getStudentId(), i.getCategory(), i.getDescription(),
                i.getSeverity(), i.getReportedBy(), i.getOccurredAt(), i.getCreatedAt()
        );
    }

    @Override
    public List<IncidentSummaryDTO> summaryForStudent(Long studentId) {
        List<IncidentSummaryDTO> out = new ArrayList<>();
        for (Incident i : incidentRepo.findByStudentIdOrderByOccurredAtDesc(studentId)) {
            out.add(new IncidentSummaryDTO(
                    i.getId(), i.getCategory(), i.getSeverity(), i.getOccurredAt()
            ));
        }
        return out;
    }

    @Override
    public void delete(Long id) {
        incidentRepo.deleteById(id);
    }
}
