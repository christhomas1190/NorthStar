package io.northstar.behavior.service;

import io.northstar.behavior.dto.CreateIncidentRequest;
import io.northstar.behavior.dto.IncidentDTO;
import io.northstar.behavior.dto.IncidentSummaryDTO;
import io.northstar.behavior.model.District;
import io.northstar.behavior.model.Incident;
import io.northstar.behavior.model.School;
import io.northstar.behavior.model.Student;
import io.northstar.behavior.model.Teacher;
import io.northstar.behavior.repository.IncidentRepository;
import io.northstar.behavior.repository.StudentRepository;
import io.northstar.behavior.repository.TeacherRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@DisplayName("IncidentService — unit tests")
class IncidentServiceTest {

    IncidentRepository incidentRepo;
    StudentRepository  studentRepo;
    TeacherRepository  teacherRepo;
    IncidentService    service;

    static final Long DISTRICT_ID = 10L;
    static final Long STUDENT_ID  = 1L;

    @BeforeEach
    void setUp() {
        incidentRepo = mock(IncidentRepository.class);
        studentRepo  = mock(StudentRepository.class);
        teacherRepo  = mock(TeacherRepository.class);
        service = new IncidentServiceImpl(incidentRepo, studentRepo, teacherRepo);
    }

    // ---------- create (top-level) ----------

    @Test
    @DisplayName("create: student found → saves incident, returns DTO")
    void create_ok() {
        District d = district(DISTRICT_ID);
        Student  s = student(STUDENT_ID, d);
        when(studentRepo.findById(STUDENT_ID)).thenReturn(Optional.of(s));

        Incident saved = incident(99L, STUDENT_ID, "Disruption", "Minor", "teacher1", d);
        when(incidentRepo.save(any(Incident.class))).thenReturn(saved);

        CreateIncidentRequest req = new CreateIncidentRequest(
                STUDENT_ID, "Disruption", "Talking in class", "Minor", "teacher1", null);
        IncidentDTO out = service.create(req);

        assertEquals(99L,          out.id());
        assertEquals(STUDENT_ID,   out.studentId());
        assertEquals("Disruption", out.category());
        assertEquals("Minor",      out.severity());
        assertEquals("teacher1",   out.reportedBy());
        assertEquals(DISTRICT_ID,  out.districtId());
    }

    @Test
    @DisplayName("create: student not found → EntityNotFoundException")
    void create_studentNotFound_throws() {
        when(studentRepo.findById(999L)).thenReturn(Optional.empty());
        CreateIncidentRequest req = new CreateIncidentRequest(999L, "X", "desc", "Minor", "t1", null);
        assertThrows(EntityNotFoundException.class, () -> service.create(req));
    }

    @Test
    @DisplayName("create: occurredAt defaults to now when null")
    void create_defaultsOccurredAtToNow() {
        District d = district(DISTRICT_ID);
        Student  s = student(STUDENT_ID, d);
        when(studentRepo.findById(STUDENT_ID)).thenReturn(Optional.of(s));

        OffsetDateTime before = OffsetDateTime.now().minusSeconds(1);
        Incident saved = incident(1L, STUDENT_ID, "Fighting", "High", "t1", d);
        saved.setOccurredAt(OffsetDateTime.now());
        when(incidentRepo.save(any(Incident.class))).thenReturn(saved);

        CreateIncidentRequest req = new CreateIncidentRequest(STUDENT_ID, "Fighting", null, "High", "t1", null);
        IncidentDTO out = service.create(req);

        // occurredAt should be after the reference time
        assertNotNull(out.occurredAt());
        assertTrue(out.occurredAt().isAfter(before.minusSeconds(2)));
    }

    // ---------- findAll ----------

    @Test
    @DisplayName("findAll: returns all incidents as DTOs")
    void findAll_returnsList() {
        District d = district(DISTRICT_ID);
        when(incidentRepo.findAll()).thenReturn(List.of(
                incident(1L, 10L, "Disruption", "Minor", "t1", d),
                incident(2L, 11L, "Fighting",   "High",  "t2", d)
        ));

        List<IncidentDTO> list = service.findAll();
        assertEquals(2, list.size());
        assertEquals("Disruption", list.get(0).category());
        assertEquals("Fighting",   list.get(1).category());
    }

    @Test
    @DisplayName("findAll: empty list returned when no incidents")
    void findAll_empty() {
        when(incidentRepo.findAll()).thenReturn(List.of());
        assertTrue(service.findAll().isEmpty());
    }

    // ---------- findById ----------

    @Test
    @DisplayName("findById: found → returns DTO")
    void findById_ok() {
        District d = district(DISTRICT_ID);
        Incident inc = incident(7L, STUDENT_ID, "Disruption", "Minor", "t1", d);
        when(incidentRepo.findById(7L)).thenReturn(Optional.of(inc));

        IncidentDTO out = service.findById(7L);
        assertEquals(7L,          out.id());
        assertEquals(STUDENT_ID,  out.studentId());
        assertEquals(DISTRICT_ID, out.districtId());
    }

    @Test
    @DisplayName("findById: not found → EntityNotFoundException")
    void findById_notFound_throws() {
        when(incidentRepo.findById(999L)).thenReturn(Optional.empty());
        assertThrows(EntityNotFoundException.class, () -> service.findById(999L));
    }

    // ---------- summaryForStudent ----------

    @Test
    @DisplayName("summaryForStudent: returns summaries for matching student")
    void summaryForStudent_returnsList() {
        District d = district(DISTRICT_ID);
        when(incidentRepo.findByStudentIdOrderByOccurredAtDesc(STUDENT_ID)).thenReturn(List.of(
                incident(1L, STUDENT_ID, "Disruption", "Minor", "t1", d),
                incident(2L, STUDENT_ID, "Tardiness",  "Low",   "t1", d)
        ));

        List<IncidentSummaryDTO> list = service.summaryForStudent(STUDENT_ID);
        assertEquals(2, list.size());
        assertEquals("Disruption", list.get(0).category());
        assertEquals("Tardiness",  list.get(1).category());
    }

    // ---------- listForStudent ----------

    @Test
    @DisplayName("listForStudent: student in correct district → returns incidents")
    void listForStudent_ok() {
        District d = district(DISTRICT_ID);
        Student  s = student(STUDENT_ID, d);
        when(studentRepo.findById(STUDENT_ID)).thenReturn(Optional.of(s));
        when(incidentRepo.findByStudentIdOrderByOccurredAtDesc(STUDENT_ID)).thenReturn(List.of(
                incident(1L, STUDENT_ID, "Disruption", "Minor", "t1", d)
        ));

        List<IncidentDTO> list = service.listForStudent(STUDENT_ID, DISTRICT_ID);
        assertEquals(1, list.size());
    }

    @Test
    @DisplayName("listForStudent: student belongs to different district → EntityNotFoundException")
    void listForStudent_wrongDistrict_throws() {
        District wrongDistrict = district(99L);
        Student  s = student(STUDENT_ID, wrongDistrict);
        when(studentRepo.findById(STUDENT_ID)).thenReturn(Optional.of(s));

        assertThrows(EntityNotFoundException.class,
                () -> service.listForStudent(STUDENT_ID, DISTRICT_ID));
    }

    // ---------- createForStudent ----------

    @Test
    @DisplayName("createForStudent: student in district → saves incident")
    void createForStudent_ok() {
        District d = district(DISTRICT_ID);
        Student  s = student(STUDENT_ID, d);
        when(studentRepo.findById(STUDENT_ID)).thenReturn(Optional.of(s));

        Incident saved = incident(55L, STUDENT_ID, "Bullying", "High", "teacher2", d);
        when(incidentRepo.save(any(Incident.class))).thenReturn(saved);

        CreateIncidentRequest req = new CreateIncidentRequest(STUDENT_ID, "Bullying", "desc", "High", "teacher2", null);
        IncidentDTO out = service.createForStudent(STUDENT_ID, DISTRICT_ID, req);

        assertEquals(55L,      out.id());
        assertEquals("Bullying", out.category());
    }

    // ---------- delete ----------

    @Test
    @DisplayName("delete: calls deleteById on repository")
    void delete_ok() {
        service.delete(1L);
        verify(incidentRepo).deleteById(1L);
    }

    // ---------- listByReportedBy ----------

    @Test
    @DisplayName("listByReportedBy: teacher found → returns incidents for that teacher")
    void listByReportedBy_ok() {
        District d   = district(DISTRICT_ID);
        Teacher  t   = new Teacher();
        t.setId(3L);
        t.setUserName("jdoe");
        t.setDistrict(d);
        when(teacherRepo.findById(3L)).thenReturn(Optional.of(t));
        when(incidentRepo.findByReportedByOrderByOccurredAtDesc("jdoe")).thenReturn(List.of(
                incident(10L, STUDENT_ID, "Disruption", "Minor", "jdoe", d)
        ));

        List<IncidentDTO> list = service.listByReportedBy(3L);
        assertEquals(1, list.size());
        assertEquals("jdoe", list.get(0).reportedBy());
    }

    @Test
    @DisplayName("listByReportedBy: teacher not found → 404")
    void listByReportedBy_teacherNotFound_throws404() {
        when(teacherRepo.findById(999L)).thenReturn(Optional.empty());
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.listByReportedBy(999L));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    // ---------- helpers ----------

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
        s.setStudentId("S" + id);
        s.setGrade("5");
        s.setDistrict(d);
        return s;
    }

    private Incident incident(Long id, Long studentId, String category, String severity,
                               String reportedBy, District d) {
        Incident inc = new Incident();
        inc.setId(id);
        inc.setStudentId(studentId);
        inc.setCategory(category);
        inc.setSeverity(severity);
        inc.setReportedBy(reportedBy);
        inc.setOccurredAt(OffsetDateTime.now());
        inc.setCreatedAt(OffsetDateTime.now());
        inc.setDistrict(d);
        return inc;
    }
}
