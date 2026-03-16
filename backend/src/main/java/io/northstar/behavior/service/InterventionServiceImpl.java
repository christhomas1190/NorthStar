package io.northstar.behavior.service;

import io.northstar.behavior.dto.CreateInterventionRequest;
import io.northstar.behavior.dto.InterventionSummaryDTO;
import io.northstar.behavior.model.Intervention;
import io.northstar.behavior.model.Student;
import io.northstar.behavior.model.TierChangeEvent;
import io.northstar.behavior.repository.AdminRepository;
import io.northstar.behavior.repository.InterventionRepository;
import io.northstar.behavior.repository.StudentRepository;
import io.northstar.behavior.repository.TierChangeEventRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class InterventionServiceImpl implements InterventionService {

    private final InterventionRepository interventions;
    private final StudentRepository students;
    private final AdminRepository admins;
    private final TierChangeEventRepository tierChangeEvents;

    public InterventionServiceImpl(InterventionRepository interventions,
                                   StudentRepository students,
                                   AdminRepository admins,
                                   TierChangeEventRepository tierChangeEvents) {
        this.interventions = interventions;
        this.students = students;
        this.admins = admins;
        this.tierChangeEvents = tierChangeEvents;
    }

    private InterventionSummaryDTO toSummary(Intervention iv) {
        long id = (iv.getId() != null) ? iv.getId() : 0L;
        Long districtId = (iv.getDistrict() != null) ? iv.getDistrict().getDistrictId() : null;

        Long studentId = null;
        String studentName = null;

        if (iv.getStudent() != null) {
            studentId = iv.getStudent().getId();
            String first = iv.getStudent().getFirstName();
            String last = iv.getStudent().getLastName();
            studentName = ((first != null) ? first : "") + ((last != null) ? " " + last : "");
            studentName = studentName.trim();
        }

        return new InterventionSummaryDTO(
                id,
                studentId,
                studentName,
                iv.getTier(),
                iv.getStrategy(),
                iv.getDescription(),
                iv.getAssignedBy(),
                iv.getStartDate(),
                iv.getEndDate(),
                districtId
        );
    }

    // Creates an intervention for a specific student
    @Override
    public InterventionSummaryDTO create(Long studentId, CreateInterventionRequest req) {
        Student s = students.findById(studentId)
                .orElseThrow(() -> new EntityNotFoundException("Student " + studentId + " not found"));

        Intervention iv = new Intervention();
        iv.setStudent(s);
        iv.setDistrict(s.getDistrict());
        iv.setTier(req.tier());
        iv.setStrategy(req.strategy());
        iv.setDescription(req.description());
        iv.setAssignedBy(req.assignedBy());

        // If your Intervention entity still has reportedBy as NOT NULL, keep it satisfied
        iv.setReportedBy(req.assignedBy());

        iv.setStartDate(req.startDate());
        iv.setEndDate(req.endDate());
        iv.setCreatedAt(req.createdAt() != null ? req.createdAt() : OffsetDateTime.now());

        Intervention saved = interventions.save(iv);

        // Auto-create tier change event
        List<Intervention> history = interventions.findByStudent_IdOrderByStartDateDesc(studentId);
        // history[0] is the one just saved; history[1] is the previous (if any)
        String fromTier = null;
        if (history.size() >= 2) {
            fromTier = history.get(1).getTier();
        }
        boolean shouldRecord = (fromTier == null) || (!req.tier().equals(fromTier));
        if (shouldRecord) {
            TierChangeEvent evt = new TierChangeEvent();
            evt.setStudent(s);
            evt.setDistrict(s.getDistrict());
            evt.setFromTier(fromTier);
            evt.setToTier(req.tier());
            evt.setChangedAt(saved.getCreatedAt());
            evt.setChangedBy(req.assignedBy());
            tierChangeEvents.save(evt);
        }

        return toSummary(saved);
    }

    // Retrieves interventions for a student, newest first
    @Override
    @Transactional(readOnly = true)
    public List<InterventionSummaryDTO> listForStudent(Long studentId) {
        List<Intervention> list = interventions.findByStudent_IdOrderByStartDateDesc(studentId);
        List<InterventionSummaryDTO> out = new ArrayList<>();
        for (int i = 0; i < list.size(); i++) out.add(toSummary(list.get(i)));
        return out;
    }

    // Lists all interventions for the current admin's district
    @Override
    @Transactional(readOnly = true)
    public List<InterventionSummaryDTO> listAll() {
        String userName = SecurityContextHolder.getContext().getAuthentication().getName();
        var admin = admins.findByUserName(userName)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "admin not found"));
        Long districtId = admin.getDistrict().getDistrictId();
        List<Intervention> list = interventions.findByDistrict_DistrictIdOrderByStartDateDesc(districtId);
        List<InterventionSummaryDTO> out = new ArrayList<>();
        for (Intervention iv : list) out.add(toSummary(iv));
        return out;
    }

    // Updates an existing intervention
    @Override
    public InterventionSummaryDTO update(Long id, CreateInterventionRequest req) {
        throw new UnsupportedOperationException("Not implemented yet");
    }

    // Deletes an intervention by id
    @Override
    public void delete(Long id) {
        interventions.deleteById(id);
    }
}
