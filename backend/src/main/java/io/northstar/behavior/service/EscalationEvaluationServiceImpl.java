package io.northstar.behavior.service;

import io.northstar.behavior.dto.StudentEscalationStatusDTO;
import io.northstar.behavior.model.EscalationRules;
import io.northstar.behavior.model.Incident;
import io.northstar.behavior.model.Student;
import io.northstar.behavior.repository.EscalationRulesRepository;
import io.northstar.behavior.repository.IncidentRepository;
import io.northstar.behavior.repository.InterventionRepository;
import io.northstar.behavior.repository.SchoolRepository;
import io.northstar.behavior.repository.StudentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class EscalationEvaluationServiceImpl implements EscalationEvaluationService {

    private final StudentRepository studentRepo;
    private final IncidentRepository incidentRepo;
    private final EscalationRulesRepository rulesRepo;
    private final SchoolRepository schoolRepo;
    private final InterventionRepository interventionRepo;

    public EscalationEvaluationServiceImpl(StudentRepository studentRepo,
                                           IncidentRepository incidentRepo,
                                           EscalationRulesRepository rulesRepo,
                                           SchoolRepository schoolRepo,
                                           InterventionRepository interventionRepo) {
        this.studentRepo = studentRepo;
        this.incidentRepo = incidentRepo;
        this.rulesRepo = rulesRepo;
        this.schoolRepo = schoolRepo;
        this.interventionRepo = interventionRepo;
    }

    @Override
    public List<StudentEscalationStatusDTO> evaluateStudents(Long schoolId) {
        var school = schoolRepo.findById(schoolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "school not found"));

        Long districtId = school.getDistrict().getDistrictId();

        // Get escalation rules (school-specific or district default)
        EscalationRules rules = rulesRepo
                .findByDistrict_DistrictIdAndSchool_SchoolId(districtId, schoolId)
                .orElseGet(() -> rulesRepo
                        .findByDistrict_DistrictIdAndSchoolIsNull(districtId)
                        .orElse(null));

        if (rules == null) {
            // No rules configured — nothing to evaluate
            return List.of();
        }

        int windowDays = rules.getTier1WindowDays();
        int decayDays = rules.getDecayDays();
        int decayCount = rules.getDecayCount();
        int cautionThreshold = rules.getSameCautionDetentionThreshold();
        int escalatedThreshold = rules.getMixedCautionDetentionThreshold();

        OffsetDateTime windowStart = OffsetDateTime.now().minusDays(windowDays);

        // Fetch all incidents in the window for this school
        List<Incident> windowIncidents = incidentRepo
                .findBySchool_SchoolIdAndOccurredAtAfterOrderByOccurredAtDesc(schoolId, windowStart);

        // Group by studentId (use the column value directly to avoid lazy-loading Student)
        Map<Long, List<Incident>> byStudent = windowIncidents.stream()
                .collect(Collectors.groupingBy(Incident::getStudentId));

        List<Student> students = studentRepo.findBySchool_SchoolId(schoolId);

        List<StudentEscalationStatusDTO> alerts = new ArrayList<>();

        for (Student s : students) {
            List<Incident> studentIncidents = byStudent.getOrDefault(s.getId(), List.of());
            int rawCount = studentIncidents.size();
            if (rawCount == 0) continue;

            // Decay: find last incident, compute full periods since then (weekdays only)
            OffsetDateTime lastIncident = studentIncidents.get(0).getOccurredAt();
            long weekdaysSinceLast = countWeekdays(lastIncident.toLocalDate(), OffsetDateTime.now().toLocalDate());
            long fullDecayPeriods = (decayDays > 0) ? weekdaysSinceLast / decayDays : 0;
            int effective = Math.max(0, rawCount - (int) (fullDecayPeriods * decayCount));

            if (effective <= 0) continue;

            String status;
            if (effective >= escalatedThreshold) {
                status = "ESCALATED";
            } else if (effective >= cautionThreshold) {
                status = "CAUTION";
            } else {
                continue; // below threshold
            }

            // If a discipline/intervention was already issued after the most recent incident, skip
            if (interventionRepo.existsByStudent_IdAndCreatedAtAfter(s.getId(), lastIncident)) {
                continue;
            }

            alerts.add(new StudentEscalationStatusDTO(
                    s.getId(),
                    s.getFirstName() + " " + s.getLastName(),
                    effective,
                    status
            ));
        }

        return alerts;
    }

    private long countWeekdays(LocalDate from, LocalDate to) {
        if (!to.isAfter(from)) return 0;
        long count = 0;
        LocalDate date = from.plusDays(1); // start counting the day after the incident
        while (!date.isAfter(to)) {
            DayOfWeek dow = date.getDayOfWeek();
            if (dow != DayOfWeek.SATURDAY && dow != DayOfWeek.SUNDAY) {
                count++;
            }
            date = date.plusDays(1);
        }
        return count;
    }
}
