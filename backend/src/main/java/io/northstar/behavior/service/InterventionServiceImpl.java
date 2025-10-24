package io.northstar.behavior.service;

import io.northstar.behavior.dto.CreateInterventionRequest;
import io.northstar.behavior.dto.InterventionSummaryDTO;
import io.northstar.behavior.model.Intervention;
import io.northstar.behavior.model.Student;
import io.northstar.behavior.repository.InterventionRepository;
import io.northstar.behavior.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@Transactional
public class InterventionServiceImpl implements InterventionService {

    private final InterventionRepository repo;
    private final StudentRepository studentRepo;

    public InterventionServiceImpl(InterventionRepository repo, StudentRepository studentRepo) {
        this.repo = repo;
        this.studentRepo = studentRepo;
    }

    @Override
    public InterventionSummaryDTO create(CreateInterventionRequest req) {
        Student s = studentRepo.findById(req.studentId()).orElseThrow();
        Intervention iv = new Intervention();
        iv.setStudent(s);
        iv.setTier(req.tier());
        iv.setStrategy(req.strategy());
        iv.setAssignedBy(req.assignedBy());
        iv.setReportedBy(req.reportedBy());
        iv.setStartDate(req.startDate());
        iv.setEndDate(req.endDate());
        iv.setCreatedAt(OffsetDateTime.now());
        return toSummary(repo.save(iv));
    }

    @Override
    public InterventionSummaryDTO update(Long id, CreateInterventionRequest req) {
        Intervention iv = repo.findById(id).orElseThrow();

        if (req.studentId() > 0) {
            Student s = studentRepo.findById(req.studentId()).orElseThrow();
            iv.setStudent(s);
        }
        if (req.tier() != null)       iv.setTier(req.tier());
        if (req.strategy() != null)   iv.setStrategy(req.strategy());
        if (req.assignedBy() != null) iv.setAssignedBy(req.assignedBy());
        if (req.reportedBy() != null) iv.setReportedBy(req.reportedBy());
        if (req.startDate() != null)  iv.setStartDate(req.startDate());
        if (req.endDate() != null)    iv.setEndDate(req.endDate());

        return toSummary(repo.save(iv));
    }

    @Override
    @Transactional(readOnly = true)
    public List<InterventionSummaryDTO> findByStudent(Long studentId) {
        return repo.findByStudent_IdOrderByStartDateDesc(studentId)
                .stream().map(this::toSummary).toList();
    }

    @Override
    public void delete(Long id) {  // <-- the missing method
        if (!repo.existsById(id)) {
            throw new IllegalArgumentException("Intervention " + id + " not found");
        }
        repo.deleteById(id);
    }

    private InterventionSummaryDTO toSummary(Intervention i) {
        return new InterventionSummaryDTO(
                i.getId(),
                i.getTier(),
                i.getStrategy(),
                i.getStartDate(),
                i.getEndDate()
        );
    }
}
