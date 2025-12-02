package io.northstar.behavior.service;

import io.northstar.behavior.dto.CreateInterventionRequest;
import io.northstar.behavior.dto.InterventionSummaryDTO;
import io.northstar.behavior.model.Intervention;
import io.northstar.behavior.model.Student;
import io.northstar.behavior.repository.InterventionRepository;
import io.northstar.behavior.repository.StudentRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class InterventionServiceImpl implements InterventionService {

    private final InterventionRepository interventions;
    private final StudentRepository students;

    public InterventionServiceImpl(InterventionRepository interventions, StudentRepository students) {
        this.interventions = interventions;
        this.students = students;
    }

    private InterventionSummaryDTO toSummary(Intervention iv) {
        long id = (iv.getId() != null) ? iv.getId() : 0L;
        long did = (iv.getDistrict() != null) ? iv.getDistrict().getDistrictId() : null;
        return new InterventionSummaryDTO(
                id,
                iv.getTier(),
                iv.getStrategy(),
                iv.getStartDate(),
                iv.getEndDate(),
                did
        );
    }

    @Override
    public InterventionSummaryDTO create(CreateInterventionRequest req) {
        Student s = students.findById(req.studentId())
                .orElseThrow(() -> new EntityNotFoundException("Student " + req.studentId() + " not found"));

        Intervention iv = new Intervention();
        iv.setStudent(s);
        iv.setDistrict(s.getDistrict());
        iv.setTier(req.tier());
        iv.setStrategy(req.strategy());
        iv.setAssignedBy(req.assignedBy());
        iv.setReportedBy(req.reportedBy());
        iv.setStartDate(req.startDate());
        iv.setEndDate(req.endDate());
        iv.setCreatedAt(req.createdAt() != null ? req.createdAt() : OffsetDateTime.now());

        return toSummary(interventions.save(iv));
    }

    @Override @Transactional(readOnly = true)
    public List<InterventionSummaryDTO> listForStudent(Long studentId) {
        List<Intervention> list = interventions.findByStudent_IdOrderByStartDateDesc(studentId);
        List<InterventionSummaryDTO> out = new ArrayList<>();
        for (Intervention iv : list) out.add(toSummary(iv));
        return out;
    }

    @Override
    public InterventionSummaryDTO update(Long id, CreateInterventionRequest req) {
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @Override
    public void delete(Long id) { interventions.deleteById(id); }
}
