package io.northstar.behavior.service;

import io.northstar.behavior.dto.StudentEscalationStatusDTO;
import io.northstar.behavior.model.*;
import io.northstar.behavior.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * School-year simulation tests (Sep 2025 → Mar 2026).
 *
 * All scenarios are evaluated from "today" (the test run date) looking back
 * through the 14-day rolling window. Incidents older than that window are
 * irrelevant to current alerts — what matters is what the student did recently
 * and whether a discipline was already issued.
 *
 * Rules:
 *   window      = 14 days
 *   caution     =  4 incidents → CAUTION
 *   escalated   =  6 incidents → ESCALATED
 *   decay       =  1 caution lost per 4 clean weekdays
 */
@DisplayName("School Year Simulation — Sep 2025 → Mar 2026")
class SchoolYearSimulationTest {

    StudentRepository      studentRepo;
    IncidentRepository     incidentRepo;
    EscalationRulesRepository rulesRepo;
    SchoolRepository       schoolRepo;
    InterventionRepository interventionRepo;

    EscalationEvaluationServiceImpl service;

    static final Long DISTRICT_ID = 1L;
    static final Long SCHOOL_ID   = 1L;

    District        district;
    School          school;
    EscalationRules rules;

    @BeforeEach
    void setUp() {
        studentRepo      = mock(StudentRepository.class);
        incidentRepo     = mock(IncidentRepository.class);
        rulesRepo        = mock(EscalationRulesRepository.class);
        schoolRepo       = mock(SchoolRepository.class);
        interventionRepo = mock(InterventionRepository.class);

        service = new EscalationEvaluationServiceImpl(
                studentRepo, incidentRepo, rulesRepo, schoolRepo, interventionRepo);

        district = new District();
        district.setDistrictId(DISTRICT_ID);
        district.setDistrictName("Lincoln USD");

        school = new School();
        school.setSchoolId(SCHOOL_ID);
        school.setSchoolName("Lincoln Middle School");
        school.setDistrict(district);

        rules = buildRules(14, 4, 4, 1, 6);

        when(schoolRepo.findById(SCHOOL_ID)).thenReturn(Optional.of(school));
        when(rulesRepo.findByDistrict_DistrictIdAndSchool_SchoolId(DISTRICT_ID, SCHOOL_ID))
                .thenReturn(Optional.of(rules));
        when(interventionRepo.existsByStudent_IdAndCreatedAtAfter(anyLong(), any()))
                .thenReturn(false);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SCENARIO 1 — The September Troublemaker
    //
    // Had 8 incidents in September 2025. Got an intervention in October.
    // Has been clean ever since. It's now March — all those old incidents
    // are far outside the 14-day window. Zero incidents returned from repo.
    // → Should NOT be flagged.
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Sep troublemaker: 8 incidents in Sep, clean since Oct — nothing in 14-day window → not flagged")
    void scenario_septemberTroublemaker_cleanNow() {
        Student s = student(1L, "Jordan", "Walsh");
        when(studentRepo.findBySchool_SchoolId(SCHOOL_ID)).thenReturn(List.of(s));

        // Repo only returns incidents within the window — none for this student
        when(incidentRepo.findBySchool_SchoolIdAndOccurredAtAfterOrderByOccurredAtDesc(eq(SCHOOL_ID), any()))
                .thenReturn(List.of());

        assertTrue(service.evaluateStudents(SCHOOL_ID).isEmpty(),
                "Student clean since October should not appear in March alerts");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SCENARIO 2 — The Spring Flare-Up
    //
    // Model student all year. In the last 6 school days, suddenly 6 incidents.
    // No discipline has been issued yet.
    // → Should be ESCALATED.
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Spring flare-up: 6 incidents in last 6 days, no prior discipline → ESCALATED")
    void scenario_springFlareUp_escalated() {
        Student s = student(2L, "Priya", "Nair");
        when(studentRepo.findBySchool_SchoolId(SCHOOL_ID)).thenReturn(List.of(s));
        stubIncidents(incidents(s, 6, 1, "mpricket"));  // Matt Pricket reporting

        List<StudentEscalationStatusDTO> result = service.evaluateStudents(SCHOOL_ID);

        assertEquals(1, result.size());
        assertEquals("ESCALATED", result.get(0).status());
        assertEquals(6, result.get(0).effectiveCautionCount());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SCENARIO 3 — Disciplined in February, Then New Incidents in March
    //
    // Student hit CAUTION in February and got an intervention.
    // But since that intervention, 4 more incidents have occurred.
    // The intervention check uses: existsByStudent_IdAndCreatedAtAfter(id, lastIncident).
    // The intervention was BEFORE the most recent incident → not satisfied → should flag.
    // → Should be flagged as CAUTION.
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Feb intervention + 4 new March incidents → still flagged CAUTION")
    void scenario_disciplinedFeb_newIncidentsMarch_reflagged() {
        Student s = student(3L, "Ethan", "Morse");
        when(studentRepo.findBySchool_SchoolId(SCHOOL_ID)).thenReturn(List.of(s));

        // 4 recent incidents, most recent yesterday
        stubIncidents(incidents(s, 4, 1, "phartt"));  // Pat Hart reporting

        // Intervention existed but was BEFORE the most recent incident → mock returns false
        when(interventionRepo.existsByStudent_IdAndCreatedAtAfter(eq(3L), any())).thenReturn(false);

        List<StudentEscalationStatusDTO> result = service.evaluateStudents(SCHOOL_ID);

        assertEquals(1, result.size());
        assertEquals("CAUTION", result.get(0).status());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SCENARIO 4 — Good Behavior After Intervention
    //
    // Student was cautioned in February and got an intervention.
    // Has had zero incidents since. Nothing in the 14-day window.
    // → Should NOT be flagged.
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Intervention in Feb, clean since → nothing in window → not flagged")
    void scenario_postIntervention_cleanSince() {
        Student s = student(4L, "Fiona", "Cheng");
        when(studentRepo.findBySchool_SchoolId(SCHOOL_ID)).thenReturn(List.of(s));

        when(incidentRepo.findBySchool_SchoolIdAndOccurredAtAfterOrderByOccurredAtDesc(eq(SCHOOL_ID), any()))
                .thenReturn(List.of());

        assertTrue(service.evaluateStudents(SCHOOL_ID).isEmpty());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SCENARIO 5 — Intervention After Most Recent Incident (Handled)
    //
    // Student has 5 incidents in the window AND an intervention that was
    // created after the most recent incident. Already being addressed.
    // → Should NOT be flagged.
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("5 incidents in window, intervention already issued after last incident → skipped")
    void scenario_interventionCoversLatestIncident_skipped() {
        Student s = student(5L, "Carlos", "Reyes");
        when(studentRepo.findBySchool_SchoolId(SCHOOL_ID)).thenReturn(List.of(s));
        stubIncidents(incidents(s, 5, 2, "jcook"));  // Jenna Cook reporting

        when(interventionRepo.existsByStudent_IdAndCreatedAtAfter(eq(5L), any())).thenReturn(true);

        assertTrue(service.evaluateStudents(SCHOOL_ID).isEmpty(),
                "Student with post-incident intervention should not be re-flagged");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SCENARIO 6 — The Slow Burner (Decay Below Threshold)
    //
    // Student collected 5 incidents earlier this month but has been clean
    // for 8 weekdays. Two decay periods have passed → effective count = 3.
    // → Should NOT be flagged.
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("5 incidents 8 weekdays ago, 2 decay periods → effective 3 → not flagged")
    void scenario_slowBurner_decayedBelowThreshold() {
        Student s = student(6L, "Tanya", "Mills");
        when(studentRepo.findBySchool_SchoolId(SCHOOL_ID)).thenReturn(List.of(s));
        stubIncidents(incidents(s, 5, weekdaysBack(8), "jheslin"));

        assertTrue(service.evaluateStudents(SCHOOL_ID).isEmpty(),
                "5 incidents minus 2 decay periods = 3, below threshold of 4");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SCENARIO 7 — Persistent Pattern: Incidents Every Week
    //
    // Student consistently gets 1-2 incidents a week all year.
    // Currently has 5 in the 14-day window, most recent 2 days ago.
    // Only 2 weekdays clean → 0 full decay periods.
    // No intervention covers the latest incidents.
    // → Should be flagged CAUTION with effective = 5.
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Persistent weekly pattern: 5 incidents, 2 weekdays clean, no decay → CAUTION")
    void scenario_persistentWeeklyPattern_caution() {
        Student s = student(7L, "Derek", "Bloom");
        when(studentRepo.findBySchool_SchoolId(SCHOOL_ID)).thenReturn(List.of(s));
        stubIncidents(incidents(s, 5, weekdaysBack(2), "afrangos"));

        List<StudentEscalationStatusDTO> result = service.evaluateStudents(SCHOOL_ID);

        assertEquals(1, result.size());
        assertEquals("CAUTION", result.get(0).status());
        assertEquals(5, result.get(0).effectiveCautionCount());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SCENARIO 8 — Partial Decay Keeps Student Just at Threshold
    //
    // Student had 5 incidents. Last one was exactly 4 weekdays ago.
    // 4 weekdays / 4 = 1 full period → lose 1 → effective = 4 = threshold.
    // → Should still be flagged as CAUTION (at the boundary).
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("5 incidents, 4 clean weekdays → 1 decay → effective 4 → still CAUTION (boundary case)")
    void scenario_decayBoundary_stillAtThreshold() {
        Student s = student(8L, "Sara", "Okonkwo");
        when(studentRepo.findBySchool_SchoolId(SCHOOL_ID)).thenReturn(List.of(s));
        stubIncidents(incidents(s, 5, weekdaysBack(4), "ehanson"));

        List<StudentEscalationStatusDTO> result = service.evaluateStudents(SCHOOL_ID);

        assertEquals(1, result.size());
        assertEquals("CAUTION", result.get(0).status());
        assertEquals(4, result.get(0).effectiveCautionCount());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SCENARIO 9 — Escalation Mid-Year, Handled, Clean, Then Relapse
    //
    // Oct: hit ESCALATED → got intervention
    // Dec: clean
    // Feb: hit CAUTION again → got another intervention
    // Mar: 3 new incidents since last intervention → below threshold
    // → Should NOT be flagged (3 < 4).
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Multiple interventions throughout year, 3 incidents post-last-intervention → not flagged")
    void scenario_multipleInterventions_currentlyBelow() {
        Student s = student(9L, "Ryan", "Vasquez");
        when(studentRepo.findBySchool_SchoolId(SCHOOL_ID)).thenReturn(List.of(s));
        stubIncidents(incidents(s, 3, 1, "jgeilda"));

        // No intervention covers the latest incidents
        when(interventionRepo.existsByStudent_IdAndCreatedAtAfter(eq(9L), any())).thenReturn(false);

        assertTrue(service.evaluateStudents(SCHOOL_ID).isEmpty(),
                "3 incidents after last intervention is below caution threshold of 4");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SCENARIO 10 — Zero-Incident Student All Year
    //
    // Model student. Not a single incident Sep–Mar.
    // → Should never appear in any alert.
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Zero incidents all year → never flagged")
    void scenario_modelStudent_neverFlagged() {
        Student s = student(10L, "Aimee", "Eckert");
        when(studentRepo.findBySchool_SchoolId(SCHOOL_ID)).thenReturn(List.of(s));

        when(incidentRepo.findBySchool_SchoolIdAndOccurredAtAfterOrderByOccurredAtDesc(eq(SCHOOL_ID), any()))
                .thenReturn(List.of());

        assertTrue(service.evaluateStudents(SCHOOL_ID).isEmpty());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SCENARIO 11 — Full Classroom (18 students) End-of-Year State
    //
    // Simulates the entire Lincoln Middle School 7th grade class as of Mar 2026.
    //
    // Students split into four groups:
    //   A) 8 students — had incidents, fully handled (intervention post last incident)
    //   B) 4 students — had incidents, decayed below threshold (8+ weekdays clean)
    //   C) 3 students — clean all year, nothing in window
    //   D) 3 students — need discipline NOW (the ones admin should act on)
    //
    // → Only group D should appear in alerts.
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Full 7th-grade class: only the 3 unaddressed students flagged")
    void scenario_fullClassroom_onlyUnaddressedFlagged() {
        // Group A — handled (intervention issued after most recent incident)
        Student[] groupA = {
            student(20L, "Matt",   "Pricket"),
            student(21L, "Pat",    "Hart"),
            student(22L, "Jenna",  "Cook"),
            student(23L, "Matt",   "Heslin"),
            student(24L, "Angelo", "Frangos"),
            student(25L, "Elana",  "Hanson"),
            student(26L, "Jody",   "Geilda"),
            student(27L, "Aimee",  "Eckert2"),
        };

        // Group B — incidents in window but decayed below threshold (5 incidents, 8 weekdays clean)
        Student[] groupB = {
            student(30L, "Ryan",   "Vasquez2"),
            student(31L, "Sara",   "Okonkwo2"),
            student(32L, "Derek",  "Bloom2"),
            student(33L, "Tanya",  "Mills2"),
        };

        // Group C — nothing in 14-day window at all
        Student[] groupC = {
            student(40L, "Carlos", "Reyes2"),
            student(41L, "Fiona",  "Cheng2"),
            student(42L, "Jordan", "Walsh2"),
        };

        // Group D — need discipline (above threshold, no covering intervention)
        Student dNeeding1 = student(50L, "Priya",  "Nair2");    // CAUTION
        Student dNeeding2 = student(51L, "Ethan",  "Morse2");   // ESCALATED
        Student dNeeding3 = student(52L, "Marcus", "Reed");     // CAUTION

        List<Student> all = new ArrayList<>();
        for (Student s : groupA) all.add(s);
        for (Student s : groupB) all.add(s);
        for (Student s : groupC) all.add(s);
        all.add(dNeeding1);
        all.add(dNeeding2);
        all.add(dNeeding3);

        when(studentRepo.findBySchool_SchoolId(SCHOOL_ID)).thenReturn(all);

        // Build incident list
        List<Incident> windowIncidents = new ArrayList<>();

        // Group A: 5 recent incidents each (above threshold, but interventions cover them)
        for (Student s : groupA) {
            windowIncidents.addAll(incidents(s, 5, 2, "mpricket"));
            when(interventionRepo.existsByStudent_IdAndCreatedAtAfter(eq(s.getId()), any()))
                    .thenReturn(true);
        }

        // Group B: 5 incidents but 8 weekdays clean → effective = 3, below threshold
        int eightWeekdaysCalDays = weekdaysBack(8);
        for (Student s : groupB) {
            windowIncidents.addAll(incidents(s, 5, eightWeekdaysCalDays, "pharttt"));
        }

        // Group C: no incidents — nothing added to list, repo returns empty for them implicitly

        // Group D: above threshold, no intervention
        windowIncidents.addAll(incidents(dNeeding1, 4, 1, "jcook2"));   // CAUTION
        windowIncidents.addAll(incidents(dNeeding2, 7, 1, "mheslin"));  // ESCALATED
        windowIncidents.addAll(incidents(dNeeding3, 5, 1, "afrangos2"));// CAUTION

        stubIncidents(windowIncidents);

        List<StudentEscalationStatusDTO> result = service.evaluateStudents(SCHOOL_ID);

        assertEquals(3, result.size(), "Exactly 3 students should need discipline");

        // Verify group D members are all present
        List<Long> flaggedIds = result.stream().map(StudentEscalationStatusDTO::studentId).toList();
        assertTrue(flaggedIds.contains(50L), "Priya Nair2 should be flagged");
        assertTrue(flaggedIds.contains(51L), "Ethan Morse2 should be flagged");
        assertTrue(flaggedIds.contains(52L), "Marcus Reed should be flagged");

        // Verify statuses
        StudentEscalationStatusDTO d1 = result.stream().filter(r -> r.studentId() == 50L).findFirst().orElseThrow();
        StudentEscalationStatusDTO d2 = result.stream().filter(r -> r.studentId() == 51L).findFirst().orElseThrow();
        StudentEscalationStatusDTO d3 = result.stream().filter(r -> r.studentId() == 52L).findFirst().orElseThrow();

        assertEquals("CAUTION",   d1.status());
        assertEquals("ESCALATED", d2.status());
        assertEquals("CAUTION",   d3.status());

        // Verify group A is NOT present (already handled)
        for (Student s : groupA) {
            assertFalse(flaggedIds.contains(s.getId()),
                    s.getFirstName() + " should not be flagged — already disciplined");
        }

        // Verify group B is NOT present (decayed below threshold)
        for (Student s : groupB) {
            assertFalse(flaggedIds.contains(s.getId()),
                    s.getFirstName() + " should not be flagged — caution count decayed");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SCENARIO 12 — Teacher Reporting Patterns Don't Affect Evaluation
    //
    // The same student's incidents are reported by five different teachers.
    // The evaluation is student-based, not teacher-based — all 6 incidents
    // count toward the student's total regardless of who filed them.
    // → Should be ESCALATED.
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("6 incidents across 5 different teachers all count toward one student → ESCALATED")
    void scenario_multiTeacherReporting_countsAsOne() {
        Student s = student(60L, "Liam", "Torres");
        when(studentRepo.findBySchool_SchoolId(SCHOOL_ID)).thenReturn(List.of(s));

        // Six incidents reported by different teachers
        String[] teachers = {"mpricket", "pharttt", "jcook", "mheslin", "afrangos", "ehanson"};
        List<Incident> inc = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            Incident incident = incident(s, (long)(600 + i), OffsetDateTime.now().minusDays(i + 1), teachers[i]);
            inc.add(incident);
        }
        stubIncidents(inc);

        List<StudentEscalationStatusDTO> result = service.evaluateStudents(SCHOOL_ID);

        assertEquals(1, result.size());
        assertEquals("ESCALATED", result.get(0).status());
        assertEquals(6, result.get(0).effectiveCautionCount());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SCENARIO 13 — Intervention Right Before New Incident Wave
    //
    // Intervention was issued yesterday. But today a new incident was logged.
    // existsByStudent_IdAndCreatedAtAfter checks: does intervention exist
    // AFTER the most recent incident? The incident happened AFTER the intervention,
    // so no → student should be flagged again.
    //
    // Tests that a prior intervention does not grant permanent immunity.
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Intervention issued, then new incidents after it → flagged again")
    void scenario_newIncidentsAfterIntervention_reflagged() {
        Student s = student(70L, "Olivia", "Chen");
        when(studentRepo.findBySchool_SchoolId(SCHOOL_ID)).thenReturn(List.of(s));

        // Most recent incident is from today — after any old intervention
        stubIncidents(incidents(s, 4, 0, "jgeilda"));

        // Intervention was before the latest incident → returns false
        when(interventionRepo.existsByStudent_IdAndCreatedAtAfter(eq(70L), any())).thenReturn(false);

        List<StudentEscalationStatusDTO> result = service.evaluateStudents(SCHOOL_ID);
        assertEquals(1, result.size());
        assertEquals("CAUTION", result.get(0).status());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // helpers
    // ─────────────────────────────────────────────────────────────────────────

    private Student student(Long id, String first, String last) {
        Student s = new Student();
        s.setId(id);
        s.setFirstName(first);
        s.setLastName(last);
        s.setStudentId("S" + id);
        s.setGrade("7");
        s.setDistrict(district);
        s.setSchool(school);
        return s;
    }

    /**
     * Creates `count` incidents for a student.
     * The most recent is `daysAgo` calendar days in the past; the rest are
     * spread one day further back each (DESC order — most recent at index 0).
     */
    private List<Incident> incidents(Student student, int count, int daysAgo, String reportedBy) {
        List<Incident> list = new ArrayList<>();
        OffsetDateTime base = OffsetDateTime.now().minusDays(daysAgo);
        for (int i = 0; i < count; i++) {
            list.add(incident(student, student.getId() * 1000 + i, base.minusDays(i), reportedBy));
        }
        return list;
    }

    private Incident incident(Student student, Long id, OffsetDateTime occurredAt, String reportedBy) {
        Incident inc = new Incident();
        inc.setId(id);
        inc.setStudent(student);
        inc.setStudentId(student.getId());
        inc.setOccurredAt(occurredAt);
        inc.setCreatedAt(occurredAt);
        inc.setCategory("Disruption");
        inc.setSeverity("Minor");
        inc.setDescription("Test incident");
        inc.setReportedBy(reportedBy);
        inc.setDistrict(district);
        inc.setSchool(school);
        return inc;
    }

    private void stubIncidents(List<Incident> list) {
        when(incidentRepo.findBySchool_SchoolIdAndOccurredAtAfterOrderByOccurredAtDesc(
                eq(SCHOOL_ID), any()))
                .thenReturn(list);
    }

    /**
     * Returns how many calendar days ago corresponds to exactly `weekdays`
     * weekdays back from today (skipping Sat/Sun).
     */
    private int weekdaysBack(int weekdays) {
        LocalDate date = LocalDate.now();
        int counted = 0;
        while (counted < weekdays) {
            date = date.minusDays(1);
            DayOfWeek dow = date.getDayOfWeek();
            if (dow != DayOfWeek.SATURDAY && dow != DayOfWeek.SUNDAY) counted++;
        }
        return (int) (LocalDate.now().toEpochDay() - date.toEpochDay());
    }

    private EscalationRules buildRules(int windowDays, int cautionThreshold,
                                       int decayDays, int decayCount, int escalatedThreshold) {
        EscalationRules r = new EscalationRules();
        r.setId(1L);
        r.setDistrict(district);
        r.setSchool(school);
        r.setTier1WindowDays(windowDays);
        r.setSameCautionDetentionThreshold(cautionThreshold);
        r.setMixedCautionDetentionThreshold(escalatedThreshold);
        r.setDecayDays(decayDays);
        r.setDecayCount(decayCount);
        r.setReviewEveryDays(7);
        r.setSameCautionTier2Threshold(8);
        r.setDetentionLabel("Detention");
        r.setDetentionDurationDays(1);
        r.setTier2Label("Tier 2");
        r.setTier2DurationDays(30);
        r.setTier1MajorToTier2(1);
        r.setTier2NoResponseCount(3);
        r.setTier2MajorToTier3(2);
        r.setRequireParentContact(false);
        r.setRequireAdminApproval(false);
        r.setNotifyRoles("Admin");
        return r;
    }
}
