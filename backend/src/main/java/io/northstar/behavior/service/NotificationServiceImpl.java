package io.northstar.behavior.service;

import io.northstar.behavior.dto.AdminNotificationDTO;
import io.northstar.behavior.model.*;
import io.northstar.behavior.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final AdminNotificationRepository notifications;
    private final EscalationRulesRepository rules;   // <-- plural
    private final IncidentRepository incidents;
    private final AdminRepository admins;

    public NotificationServiceImpl(AdminNotificationRepository notifications,
                                   EscalationRulesRepository rules,
                                   IncidentRepository incidents,
                                   AdminRepository admins) {
        this.notifications = notifications;
        this.rules = rules;
        this.incidents = incidents;
        this.admins = admins;
    }
    private AdminNotificationDTO toDto(AdminNotification n) {
        String studentName =
                n.getStudent().getFirstName() + " " + n.getStudent().getLastName();

        String ruleLabel = n.getRule().getTier2Label(); // using your EscalationRules fields

        return new AdminNotificationDTO(
                n.getId(),
                n.getStudent().getId(),
                studentName,
                n.getIncident().getId(),
                ruleLabel,
                n.getMessage(),
                n.getCreatedAt(),
                n.isRead()
        );
    }
    @Override
    public List<AdminNotificationDTO> unreadForAdmin(Long adminId) {
        List<AdminNotification> list =
                notifications.findByAdminIdAndReadFalseOrderByCreatedAtDesc(adminId);

        List<AdminNotificationDTO> dtoList = new ArrayList<>();
        for (AdminNotification n : list) {
            dtoList.add(toDto(n));
        }
        return dtoList;
    }

    @Override
    public void markAsRead(Long adminId, Long notificationId) {
        AdminNotification n = notifications.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

        if (!n.getAdmin().getId().equals(adminId)) {
            throw new IllegalStateException("Notification does not belong to this admin");
        }

        n.setRead(true);
    }
    @Override
    public void evaluateEscalationsForIncident(Incident incident) {
        Student student = incident.getStudent();
        School school = student.getSchool();
        District district = school.getDistrict();

        Long districtId = district.getDistrictId();
        Long schoolId   = school.getSchoolId();

        // 1) Try school-specific rules
        EscalationRules rule = rules
                .findByDistrict_DistrictIdAndSchool_SchoolId(districtId, schoolId)
                // 2) If none, fall back to district-wide rules (school is null)
                .orElseGet(() -> rules
                        .findByDistrict_DistrictIdAndSchoolIsNull(districtId)
                        .orElseThrow(() -> new IllegalStateException(
                                "No escalation rules configured for district " + districtId +
                                        " (school " + schoolId + " or district default)."
                        ))
                );

        int windowDays = rule.getTier1WindowDays();
        int threshold  = rule.getSameCautionDetentionThreshold();

        if (!thresholdReachedSameCaution(incident, windowDays, threshold)) {
            return;
        }

        List<Admin> schoolAdmins = admins.findBySchool_SchoolId(schoolId);
        String message = buildMessage(rule, incident, student);

        for (Admin admin : schoolAdmins) {
            AdminNotification n = new AdminNotification(
                    admin,
                    student,
                    incident,
                    rule,
                    message
            );
            notifications.save(n);
        }
    }

    private boolean thresholdReachedSameCaution(Incident incident,
                                                int windowDays,
                                                int threshold) {
        OffsetDateTime cutoff = OffsetDateTime.now().minusDays(windowDays);
        List<Incident> all = incidents.findByStudentIdOrderByOccurredAtDesc(
                incident.getStudent().getId()
        );

        int count = 0;
        for (Incident i : all) {
            if (i.getOccurredAt().isBefore(cutoff)) {
                break;
            }
            if (i.getCategory().equalsIgnoreCase(incident.getCategory())) {
                count++;
            }
        }

        return count >= threshold;
    }

    private String buildMessage(EscalationRules rule, Incident incident, Student student) {
        return "Student " + student.getFirstName() + " " + student.getLastName() +
                " has reached the threshold for " + rule.getDetentionLabel() +
                " (" + rule.getSameCautionDetentionThreshold() + " same caution incidents in "
                + rule.getTier1WindowDays() + " days). Last incident: " +
                incident.getCategory() + ".";
    }
}