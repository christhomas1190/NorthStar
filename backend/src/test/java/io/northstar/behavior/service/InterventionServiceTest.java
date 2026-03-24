package io.northstar.behavior.service;

import io.northstar.behavior.dto.CreateInterventionRequest;
import io.northstar.behavior.dto.InterventionSummaryDTO;
import io.northstar.behavior.model.District;
import io.northstar.behavior.model.Intervention;
import io.northstar.behavior.model.Student;
import io.northstar.behavior.model.TierChangeEvent;
import io.northstar.behavior.repository.AdminRepository;
import io.northstar.behavior.repository.InterventionRepository;
import io.northstar.behavior.repository.StudentRepository;
import io.northstar.behavior.repository.TierChangeEventRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@DisplayName("InterventionService — unit tests")
class InterventionServiceTest {

    InterventionRepository    interventionRepo;
    StudentRepository         studentRepo;
    AdminRepository           adminRepo;
    TierChangeEventRepository tierChangeEventRepo;
    InterventionService       service;

    static final Long STUDENT_ID  = 1L;
    static final Long DISTRICT_ID = 10L;

    @BeforeEach
    void setUp() {
        interventionRepo    = mock(InterventionRepository.class);
        studentRepo         = mock(StudentRepository.class);
        adminRepo           = mock(AdminRepository.class);
        tierChangeEventRepo = mock(TierChangeEventRepository.class);
        service = new InterventionServiceImpl(interventionRepo, studentRepo, adminRepo, tierChangeEventRepo);
    }

    // ---------- create ----------

    @Test
    @DisplayName("create: first intervention for student → TierChangeEvent recorded")
    void create_firstIntervention_createsTierChangeEvent() {
        District d = district(DISTRICT_ID);
        Student  s = student(STUDENT_ID, d);
        when(studentRepo.findById(STUDENT_ID)).thenReturn(Optional.of(s));

        Intervention saved = intervention(77L, "TIER_1", "Check-in/Check-out", s, d);
        when(interventionRepo.save(any(Intervention.class))).thenReturn(saved);

        // First intervention: history has only the newly saved one
        when(interventionRepo.findByStudent_IdOrderByStartDateDesc(STUDENT_ID))
                .thenReturn(List.of(saved));

        CreateInterventionRequest req = createReq("TIER_1", "Check-in/Check-out", "admin1");
        InterventionSummaryDTO out = service.create(STUDENT_ID, req);

        assertEquals(77L,                   out.id());
        assertEquals("TIER_1",              out.tier());
        assertEquals("Check-in/Check-out",  out.strategy());
        assertEquals(STUDENT_ID,            out.studentId());

        // TierChangeEvent should have been saved (fromTier=null on first assignment)
        verify(tierChangeEventRepo).save(any(TierChangeEvent.class));
    }

    @Test
    @DisplayName("create: tier changes from previous → TierChangeEvent recorded")
    void create_tierChanges_createsTierChangeEvent() {
        District d = district(DISTRICT_ID);
        Student  s = student(STUDENT_ID, d);
        when(studentRepo.findById(STUDENT_ID)).thenReturn(Optional.of(s));

        Intervention prev    = intervention(1L, "TIER_1", "Check-in",   s, d);
        Intervention current = intervention(2L, "TIER_2", "Check-in/Out", s, d);
        when(interventionRepo.save(any(Intervention.class))).thenReturn(current);
        when(interventionRepo.findByStudent_IdOrderByStartDateDesc(STUDENT_ID))
                .thenReturn(List.of(current, prev)); // newest first

        service.create(STUDENT_ID, createReq("TIER_2", "Check-in/Out", "admin1"));

        verify(tierChangeEventRepo).save(any(TierChangeEvent.class));
    }

    @Test
    @DisplayName("create: same tier as previous → TierChangeEvent NOT recorded")
    void create_sameTierAsPrevious_skipsEvent() {
        District d = district(DISTRICT_ID);
        Student  s = student(STUDENT_ID, d);
        when(studentRepo.findById(STUDENT_ID)).thenReturn(Optional.of(s));

        Intervention prev    = intervention(1L, "TIER_1", "strategy", s, d);
        Intervention current = intervention(2L, "TIER_1", "strategy2", s, d);
        when(interventionRepo.save(any(Intervention.class))).thenReturn(current);
        when(interventionRepo.findByStudent_IdOrderByStartDateDesc(STUDENT_ID))
                .thenReturn(List.of(current, prev));

        service.create(STUDENT_ID, createReq("TIER_1", "strategy2", "admin1"));

        verify(tierChangeEventRepo, never()).save(any(TierChangeEvent.class));
    }

    @Test
    @DisplayName("create: student not found → EntityNotFoundException")
    void create_studentNotFound_throws() {
        when(studentRepo.findById(999L)).thenReturn(Optional.empty());
        assertThrows(EntityNotFoundException.class,
                () -> service.create(999L, createReq("TIER_1", "strategy", "admin1")));
    }

    // ---------- listForStudent ----------

    @Test
    @DisplayName("listForStudent: returns interventions newest-first")
    void listForStudent_returnsList() {
        District d = district(DISTRICT_ID);
        Student  s = student(STUDENT_ID, d);
        Intervention i1 = intervention(10L, "TIER_2", "Strategy B", s, d);
        Intervention i2 = intervention(9L,  "TIER_1", "Strategy A", s, d);

        when(interventionRepo.findByStudent_IdOrderByStartDateDesc(STUDENT_ID))
                .thenReturn(List.of(i1, i2));

        List<InterventionSummaryDTO> list = service.listForStudent(STUDENT_ID);
        assertEquals(2,        list.size());
        assertEquals("TIER_2", list.get(0).tier());
        assertEquals("TIER_1", list.get(1).tier());
    }

    @Test
    @DisplayName("listForStudent: no interventions → empty list")
    void listForStudent_empty() {
        when(interventionRepo.findByStudent_IdOrderByStartDateDesc(STUDENT_ID))
                .thenReturn(List.of());
        assertTrue(service.listForStudent(STUDENT_ID).isEmpty());
    }

    // ---------- delete ----------

    @Test
    @DisplayName("delete: calls deleteById on repository")
    void delete_ok() {
        service.delete(5L);
        verify(interventionRepo).deleteById(5L);
    }

    // ---------- helpers ----------

    private CreateInterventionRequest createReq(String tier, String strategy, String assignedBy) {
        return new CreateInterventionRequest(
                tier,
                strategy,
                "description",
                assignedBy,
                LocalDate.now(),
                null,
                OffsetDateTime.now()
        );
    }

    private District district(Long id) {
        District d = new District();
        d.setDistrictId(id);
        return d;
    }

    private Student student(Long id, District d) {
        Student s = new Student();
        s.setId(id);
        s.setFirstName("Test");
        s.setLastName("Student");
        s.setDistrict(d);
        return s;
    }

    private Intervention intervention(Long id, String tier, String strategy, Student s, District d) {
        Intervention iv = new Intervention();
        iv.setId(id);
        iv.setTier(tier);
        iv.setStrategy(strategy);
        iv.setDescription("desc");
        iv.setAssignedBy("admin1");
        iv.setReportedBy("admin1");
        iv.setStartDate(LocalDate.now());
        iv.setCreatedAt(OffsetDateTime.now());
        iv.setStudent(s);
        iv.setDistrict(d);
        return iv;
    }
}
