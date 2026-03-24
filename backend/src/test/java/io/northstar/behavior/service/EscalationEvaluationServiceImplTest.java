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
 * Unit tests for EscalationEvaluationServiceImpl.
 *
 * Rules under test (configured in setUp):
 *   - window:             14 days
 *   - caution threshold:   4 incidents → CAUTION
 *   - escalated threshold: 6 incidents → ESCALATED
 *   - decay:               lose 1 caution per 4 clean weekdays
 */
@DisplayName("EscalationEvaluationService — unit tests")
class EscalationEvaluationServiceImplTest {

    StudentRepository     studentRepo;
    IncidentRepository    incidentRepo;
    EscalationRulesRepository rulesRepo;
    SchoolRepository      schoolRepo;
    InterventionRepository interventionRepo;

    EscalationEvaluationServiceImpl service;

    static final Long DISTRICT_ID = 1L;
    static final Long SCHOOL_ID   = 1L;

    District       district;
    School         school;
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
        // Default: no existing interventions
        when(interventionRepo.existsByStudent_IdAndCreatedAtAfter(anyLong(), any()))
                .thenReturn(false);
    }

    // ── 1. No rules → empty ──────────────────────────────────────────────────

    @Test
    @DisplayName("No escalation rules configured → returns empty list")
    void noRules_returnsEmpty() {
        when(rulesRepo.findByDistrict_DistrictIdAndSchool_SchoolId(DISTRICT_ID, SCHOOL_ID))
                .thenReturn(Optional.empty());
        when(rulesRepo.findByDistrict_DistrictIdAndSchoolIsNull(DISTRICT_ID))
                .thenReturn(Optional.empty());

        assertTrue(service.evaluateStudents(SCHOOL_ID).isEmpty());
    }

    // ── 2. No incidents in window ────────────────────────────────────────────

    @Test
    @DisplayName("No incidents in the rolling window → no alerts")
    void noIncidentsInWindow_noAlerts() {
        when(studentRepo.findBySchool_SchoolId(SCHOOL_ID))
                .thenReturn(List.of(student(1L, "Alice", "Smith")));
        when(incidentRepo.findBySchool_SchoolIdAndOccurredAtAfterOrderByOccurredAtDesc(eq(SCHOOL_ID), any()))
                .thenReturn(List.of());

        assertTrue(service.evaluateStudents(SCHOOL_ID).isEmpty());
    }

    // ── 3. Below threshold ───────────────────────────────────────────────────

    @Test
    @DisplayName("3 incidents (below caution threshold of 4) → not flagged")
    void belowThreshold_notFlagged() {
        Student s = student(2L, "Bob", "Jones");
        when(studentRepo.findBySchool_SchoolId(SCHOOL_ID)).thenReturn(List.of(s));
        stubIncidents(incidents(s, 3, daysAgo(1)));

        assertTrue(service.evaluateStudents(SCHOOL_ID).isEmpty());
    }

    // ── 4. CAUTION status ────────────────────────────────────────────────────

    @Test
    @DisplayName("4 incidents (at caution threshold) → flagged CAUTION with effective count 4")
    void atCautionThreshold_flaggedAsCAUTION() {
        Student s = student(3L, "Carol", "White");
        when(studentRepo.findBySchool_SchoolId(SCHOOL_ID)).thenReturn(List.of(s));
        stubIncidents(incidents(s, 4, daysAgo(1)));

        List<StudentEscalationStatusDTO> result = service.evaluateStudents(SCHOOL_ID);

        assertEquals(1, result.size());
        assertEquals("CAUTION", result.get(0).status());
        assertEquals(4, result.get(0).effectiveCautionCount());
    }

    // ── 5. ESCALATED status ──────────────────────────────────────────────────

    @Test
    @DisplayName("6 incidents (at escalated threshold) → flagged ESCALATED")
    void atEscalatedThreshold_flaggedAsESCALATED() {
        Student s = student(4L, "Dave", "Brown");
        when(studentRepo.findBySchool_SchoolId(SCHOOL_ID)).thenReturn(List.of(s));
        stubIncidents(incidents(s, 6, daysAgo(1)));

        List<StudentEscalationStatusDTO> result = service.evaluateStudents(SCHOOL_ID);

        assertEquals(1, result.size());
        assertEquals("ESCALATED", result.get(0).status());
    }

    // ── 6. Already disciplined → skipped ─────────────────────────────────────

    @Test
    @DisplayName("Student above threshold but already disciplined → skipped")
    void alreadyDisciplined_skipped() {
        Student s = student(5L, "Eve", "Green");
        when(studentRepo.findBySchool_SchoolId(SCHOOL_ID)).thenReturn(List.of(s));
        stubIncidents(incidents(s, 5, daysAgo(1)));
        when(interventionRepo.existsByStudent_IdAndCreatedAtAfter(eq(5L), any())).thenReturn(true);

        assertTrue(service.evaluateStudents(SCHOOL_ID).isEmpty());
    }

    // ── 7. Full decay drops below threshold ──────────────────────────────────

    @Test
    @DisplayName("5 incidents, 8 clean weekdays → 2 decay periods → effective 3 → not flagged")
    void fullDecay_dropsBelow_notFlagged() {
        // 8 weekdays / 4 per period = 2 periods × 1 count = subtract 2 → 5-2=3 < threshold of 4
        Student s = student(6L, "Frank", "Black");
        when(studentRepo.findBySchool_SchoolId(SCHOOL_ID)).thenReturn(List.of(s));
        stubIncidents(incidents(s, 5, weekdaysBack(8)));

        assertTrue(service.evaluateStudents(SCHOOL_ID).isEmpty(),
                "5 incidents minus 2 decay = 3, should be below threshold of 4");
    }

    // ── 8. Partial decay, still above threshold ───────────────────────────────

    @Test
    @DisplayName("6 incidents, 4 clean weekdays → 1 decay period → effective 5 → flagged CAUTION")
    void partialDecay_stillFlagged() {
        // 4 weekdays / 4 per period = 1 period × 1 = subtract 1 → 6-1=5 → CAUTION
        Student s = student(7L, "Grace", "Hill");
        when(studentRepo.findBySchool_SchoolId(SCHOOL_ID)).thenReturn(List.of(s));
        stubIncidents(incidents(s, 6, weekdaysBack(4)));

        List<StudentEscalationStatusDTO> result = service.evaluateStudents(SCHOOL_ID);

        assertEquals(1, result.size());
        assertEquals("CAUTION", result.get(0).status());
        assertEquals(5, result.get(0).effectiveCautionCount());
    }

    // ── 9. Weekends don't count toward decay ─────────────────────────────────

    @Test
    @DisplayName("Weekends skipped: last incident on Friday, span crosses 2 weekend days — only weekdays counted")
    void weekendDaysNotCountedInDecay() {
        // Find last Friday; incidents on that Friday
        // Calendar days to today: includes Sat + Sun = non-weekdays
        // Weekdays since Friday = Mon, Tue, Wed, Thu (if today >= Thu of following week)
        // We pick an incident 9 weekdays ago:
        //   → calendar span is ~13 days (9 weekdays + 2 weekend days + buffer)
        //   → weekday calc: 9/4 = 2 full periods → 6-2=4 → CAUTION
        //   → calendar calc (if used): ~13/4 = 3 periods → 6-3=3 → NOT flagged
        //
        // This verifies weekday counting changes the outcome vs naive calendar counting.

        Student s = student(8L, "Henry", "Adams");
        when(studentRepo.findBySchool_SchoolId(SCHOOL_ID)).thenReturn(List.of(s));

        // 9 weekdays back expressed as calendar days
        stubIncidents(incidents(s, 6, weekdaysBack(9)));

        List<StudentEscalationStatusDTO> result = service.evaluateStudents(SCHOOL_ID);

        // 6 incidents, 9 weekdays clean → 2 full decay periods → effective=4 → CAUTION
        assertEquals(1, result.size(), "Should be flagged when only weekdays are counted (not calendar days)");
        assertEquals("CAUTION", result.get(0).status());
        assertEquals(4, result.get(0).effectiveCautionCount());
    }

    // ── 10. Zero decay when incident is today ────────────────────────────────

    @Test
    @DisplayName("Incident occurred today → zero weekdays elapsed → no decay applied")
    void incidentToday_noDecay() {
        Student s = student(9L, "Iris", "Lane");
        when(studentRepo.findBySchool_SchoolId(SCHOOL_ID)).thenReturn(List.of(s));
        stubIncidents(incidents(s, 4, daysAgo(0)));

        List<StudentEscalationStatusDTO> result = service.evaluateStudents(SCHOOL_ID);

        assertEquals(1, result.size());
        assertEquals(4, result.get(0).effectiveCautionCount(), "No decay should apply on day of incident");
    }

    // ── 11. School year simulation ────────────────────────────────────────────

    @Test
    @DisplayName("School year simulation (Sep 2025 – Mar 2026): 18 handled students, 1 undisciplined flagged")
    void schoolYearSimulation_onlyUndisciplinedFlagged() {
        // Named teachers from the real roster (for documentation context only — incidents
        // are attributed by username in production; here we just verify evaluation logic).
        //
        // Setup: 18 students all have enough recent incidents to trigger CAUTION,
        //        but 17 have already received an intervention (handled during the year).
        //        1 student — Marcus Reed — is the undisciplined case we leave for manual testing.

        List<Student> students = new ArrayList<>();
        List<Long> handledIds = new ArrayList<>();

        String[][] roster = {
            {"Matt",    "Pricket"},  {"Pat",    "Hart"},   {"Jenna",  "Cook"},
            {"Matt",    "Heslin"},   {"Angelo", "Frangos"},{"Elana",  "Hanson"},
            {"Jody",    "Geilda"},   {"Aimee",  "Eckert"}, {"Ryan",   "Vasquez"},
            {"Sara",    "Okonkwo"},  {"Derek",  "Bloom"},  {"Tanya",  "Mills"},
            {"Carlos",  "Reyes"},    {"Fiona",  "Cheng"},  {"Jordan", "Walsh"},
            {"Priya",   "Nair"},     {"Ethan",  "Morse"},
        };

        long idCounter = 100L;
        List<Incident> allIncidents = new ArrayList<>();

        for (String[] name : roster) {
            Student s = student(idCounter, name[0], name[1]);
            students.add(s);
            handledIds.add(idCounter);
            allIncidents.addAll(incidents(s, 5, daysAgo(2)));
            idCounter++;
        }

        // The one undisciplined student
        Student target = student(idCounter, "Marcus", "Reed");
        students.add(target);
        allIncidents.addAll(incidents(target, 5, daysAgo(1)));

        when(studentRepo.findBySchool_SchoolId(SCHOOL_ID)).thenReturn(students);
        stubIncidents(allIncidents);

        // All handled students have an intervention after their last incident
        for (Long hid : handledIds) {
            when(interventionRepo.existsByStudent_IdAndCreatedAtAfter(eq(hid), any())).thenReturn(true);
        }
        // Marcus Reed has NO intervention (default mock is false)

        List<StudentEscalationStatusDTO> result = service.evaluateStudents(SCHOOL_ID);

        assertEquals(1, result.size(), "Only Marcus Reed should be flagged");
        assertEquals(idCounter, result.get(0).studentId());
        assertEquals("Marcus Reed", result.get(0).studentName());
        assertEquals("CAUTION", result.get(0).status());
        assertEquals(5, result.get(0).effectiveCautionCount());
    }

    // ── 12. Multiple students, mixed statuses ─────────────────────────────────

    @Test
    @DisplayName("Multiple students at different thresholds → each gets correct status")
    void multipleStudents_correctStatuses() {
        Student below     = student(20L, "Anna",   "Kay");    // 3 incidents — below threshold
        Student caution   = student(21L, "Ben",    "Fox");    // 4 incidents — CAUTION
        Student escalated = student(22L, "Claire", "Park");   // 7 incidents — ESCALATED
        Student handled   = student(23L, "Dan",    "Ross");   // 5 incidents — but disciplined

        when(studentRepo.findBySchool_SchoolId(SCHOOL_ID))
                .thenReturn(List.of(below, caution, escalated, handled));

        List<Incident> all = new ArrayList<>();
        all.addAll(incidents(below,     3, daysAgo(1)));
        all.addAll(incidents(caution,   4, daysAgo(1)));
        all.addAll(incidents(escalated, 7, daysAgo(1)));
        all.addAll(incidents(handled,   5, daysAgo(1)));
        stubIncidents(all);

        when(interventionRepo.existsByStudent_IdAndCreatedAtAfter(eq(23L), any())).thenReturn(true);

        List<StudentEscalationStatusDTO> result = service.evaluateStudents(SCHOOL_ID);

        assertEquals(2, result.size());

        StudentEscalationStatusDTO cResult = result.stream()
                .filter(r -> r.studentId().equals(21L)).findFirst().orElseThrow();
        assertEquals("CAUTION", cResult.status());
        assertEquals(4, cResult.effectiveCautionCount());

        StudentEscalationStatusDTO eResult = result.stream()
                .filter(r -> r.studentId().equals(22L)).findFirst().orElseThrow();
        assertEquals("ESCALATED", eResult.status());
        assertEquals(7, eResult.effectiveCautionCount());
    }

    // ── helpers ───────────────────────────────────────────────────────────────

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
     * Builds a list of `count` incidents for a student.
     * The most recent one is `daysAgo` calendar days in the past.
     * The rest are spread one day each further back (desc order → most recent first).
     */
    private List<Incident> incidents(Student student, int count, int daysAgo) {
        List<Incident> list = new ArrayList<>();
        OffsetDateTime base = OffsetDateTime.now().minusDays(daysAgo);
        for (int i = 0; i < count; i++) {
            Incident inc = new Incident();
            inc.setId(student.getId() * 1000 + i);
            inc.setStudent(student);
            inc.setStudentId(student.getId());
            inc.setOccurredAt(base.minusDays(i));   // most recent first
            inc.setCreatedAt(base.minusDays(i));
            inc.setCategory("Disruption");
            inc.setSeverity("Minor");
            inc.setDescription("Test incident " + i);
            inc.setReportedBy("teacher_test");
            inc.setDistrict(district);
            inc.setSchool(school);
            list.add(inc);
        }
        return list;
    }

    private void stubIncidents(List<Incident> list) {
        when(incidentRepo.findBySchool_SchoolIdAndOccurredAtAfterOrderByOccurredAtDesc(
                eq(SCHOOL_ID), any()))
                .thenReturn(list);
    }

    /** Calendar days for `n` incidents that all occurred on the same day (today - daysAgo). */
    private int daysAgo(int n) { return n; }

    /**
     * Returns how many calendar days ago a date exactly `weekdays` weekdays back is.
     * Used to produce an OffsetDateTime whose weekday distance from today is precise.
     */
    private int weekdaysBack(int weekdays) {
        LocalDate date = LocalDate.now();
        int counted = 0;
        while (counted < weekdays) {
            date = date.minusDays(1);
            DayOfWeek dow = date.getDayOfWeek();
            if (dow != DayOfWeek.SATURDAY && dow != DayOfWeek.SUNDAY) {
                counted++;
            }
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
