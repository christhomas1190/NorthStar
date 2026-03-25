package io.northstar.behavior.service;

import io.northstar.behavior.dto.CreateStudentRequest;
import io.northstar.behavior.dto.StudentDTO;
import io.northstar.behavior.model.District;
import io.northstar.behavior.model.School;
import io.northstar.behavior.model.Student;
import io.northstar.behavior.repository.DistrictRepository;
import io.northstar.behavior.repository.IncidentRepository;
import io.northstar.behavior.repository.InterventionRepository;
import io.northstar.behavior.repository.SchoolRepository;
import io.northstar.behavior.repository.StudentRepository;
import io.northstar.behavior.tenant.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@DisplayName("StudentService — unit tests")
class StudentServiceTest {

    StudentRepository repo;
    DistrictRepository districtRepo;
    SchoolRepository schoolRepo;
    IncidentRepository incidentRepo;
    InterventionRepository interventionRepo;
    io.northstar.behavior.repository.GradeRepository gradeRepo;
    io.northstar.behavior.repository.AssignmentRepository assignmentRepo;
    StudentService service;

    static final Long DISTRICT_ID = 10L;
    static final Long SCHOOL_ID   = 5L;

    @BeforeEach
    void setUp() {
        repo             = mock(StudentRepository.class);
        districtRepo     = mock(DistrictRepository.class);
        schoolRepo       = mock(SchoolRepository.class);
        incidentRepo     = mock(IncidentRepository.class);
        interventionRepo = mock(InterventionRepository.class);
        gradeRepo        = mock(io.northstar.behavior.repository.GradeRepository.class);
        assignmentRepo   = mock(io.northstar.behavior.repository.AssignmentRepository.class);
        service = new StudentServiceImpl(repo, districtRepo, schoolRepo, incidentRepo, interventionRepo, gradeRepo, assignmentRepo);

        TenantContext.setDistrictId(DISTRICT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    // ---------- create ----------

    @Test
    @DisplayName("create: valid request → returns saved DTO with correct fields")
    void create_ok() {
        District d = district(DISTRICT_ID);
        School   s = school(SCHOOL_ID, d);

        when(repo.existsByStudentIdAndDistrict_DistrictId("S001", DISTRICT_ID)).thenReturn(false);
        when(schoolRepo.findById(SCHOOL_ID)).thenReturn(Optional.of(s));
        when(districtRepo.getReferenceById(DISTRICT_ID)).thenReturn(d);

        Student saved = student(42L, "Ada", "Lovelace", "S001", "8", d, s);
        when(repo.save(any(Student.class))).thenReturn(saved);

        StudentDTO out = service.create(new CreateStudentRequest("Ada", "Lovelace", "S001", "8", SCHOOL_ID));

        assertEquals(42L,      out.id());
        assertEquals("Ada",    out.firstName());
        assertEquals("Lovelace", out.lastName());
        assertEquals("S001",   out.studentId());
        assertEquals("8",      out.grade());
        assertEquals(DISTRICT_ID, out.districtId());
        assertEquals(SCHOOL_ID,   out.schoolId());
    }

    @Test
    @DisplayName("create: duplicate studentId in district → 409 Conflict")
    void create_duplicateStudentId_throws409() {
        when(repo.existsByStudentIdAndDistrict_DistrictId("DUP", DISTRICT_ID)).thenReturn(true);

        District d = district(DISTRICT_ID);
        School   s = school(SCHOOL_ID, d);
        when(schoolRepo.findById(SCHOOL_ID)).thenReturn(Optional.of(s));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.create(new CreateStudentRequest("First", "Last", "DUP", "7", SCHOOL_ID)));
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
    }

    @Test
    @DisplayName("create: school not found → 404")
    void create_schoolNotFound_throws404() {
        when(repo.existsByStudentIdAndDistrict_DistrictId(anyString(), anyLong())).thenReturn(false);
        when(schoolRepo.findById(SCHOOL_ID)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.create(new CreateStudentRequest("A", "B", "S999", "5", SCHOOL_ID)));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    // ---------- update ----------

    @Test
    @DisplayName("update: found student → fields updated, DTO returned")
    void update_ok() {
        District d = district(DISTRICT_ID);
        School   s = school(SCHOOL_ID, d);
        Student  existing = student(100L, "Alan", "Turing", "T100", "7", d, s);

        when(repo.findByIdAndDistrict_DistrictId(100L, DISTRICT_ID))
                .thenReturn(Optional.of(existing));

        StudentDTO patch = new StudentDTO(100L, "Al", "Tur", "T100", "7", List.of(), List.of(), DISTRICT_ID, SCHOOL_ID, null);
        StudentDTO out = service.update(100L, patch);

        assertEquals("Al",  out.firstName());
        assertEquals("Tur", out.lastName());
    }

    @Test
    @DisplayName("update: student not found → 404")
    void update_notFound_throws404() {
        when(repo.findByIdAndDistrict_DistrictId(999L, DISTRICT_ID)).thenReturn(Optional.empty());

        StudentDTO patch = new StudentDTO(999L, "X", "Y", "S0", "5", List.of(), List.of(), DISTRICT_ID, SCHOOL_ID, null);
        assertThrows(Exception.class, () -> service.update(999L, patch));
    }

    // ---------- findAll ----------

    @Test
    @DisplayName("findAll: returns students scoped to current district")
    void findAll_scopedByDistrict() {
        District d = district(DISTRICT_ID);
        School   s = school(SCHOOL_ID, d);
        Student  s1 = student(1L, "Grace", "Hopper", "G100", "6", d, s);
        Student  s2 = student(2L, "John",  "Von Neumann", "J200", "9", d, s);

        when(repo.findByDistrict_DistrictId(DISTRICT_ID)).thenReturn(List.of(s1, s2));

        List<StudentDTO> list = service.findAll();

        assertEquals(2, list.size());
        assertEquals("Grace",  list.get(0).firstName());
        assertEquals(DISTRICT_ID, list.get(0).districtId());
        assertEquals(DISTRICT_ID, list.get(1).districtId());
    }

    @Test
    @DisplayName("findAll: no students returns empty list")
    void findAll_emptyList() {
        when(repo.findByDistrict_DistrictId(DISTRICT_ID)).thenReturn(List.of());
        assertTrue(service.findAll().isEmpty());
    }

    // ---------- findById ----------

    @Test
    @DisplayName("findById: found → returns DTO")
    void findById_ok() {
        District d = district(DISTRICT_ID);
        School   s = school(SCHOOL_ID, d);
        Student  st = student(7L, "Marie", "Curie", "M007", "10", d, s);
        when(repo.findByIdAndDistrict_DistrictId(7L, DISTRICT_ID)).thenReturn(Optional.of(st));

        StudentDTO out = service.findById(7L);
        assertEquals(7L,     out.id());
        assertEquals("Marie", out.firstName());
        assertEquals("Curie", out.lastName());
    }

    @Test
    @DisplayName("findById: missing → throws")
    void findById_notFound_throws() {
        when(repo.findById(999L)).thenReturn(Optional.empty());
        assertThrows(Exception.class, () -> service.findById(999L));
    }

    // ---------- delete ----------

    @Test
    @DisplayName("delete: exists → delete called")
    void delete_ok() {
        District d = district(DISTRICT_ID);
        School   s = school(SCHOOL_ID, d);
        Student  st = student(1L, "Ada", "Lovelace", "A001", "8", d, s);
        when(repo.findByIdAndDistrict_DistrictId(1L, DISTRICT_ID)).thenReturn(Optional.of(st));
        service.delete(1L);
        verify(repo).delete(st);
    }

    @Test
    @DisplayName("delete: not found → 404")
    void delete_notFound_throws404() {
        when(repo.existsById(999L)).thenReturn(false);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.delete(999L));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    // ---------- helpers ----------

    private District district(Long id) {
        District d = new District();
        d.setDistrictId(id);
        d.setDistrictName("Test District " + id);
        return d;
    }

    private School school(Long id, District d) {
        School s = new School();
        s.setSchoolId(id);
        s.setSchoolName("Test School " + id);
        s.setDistrict(d);
        return s;
    }

    private Student student(Long id, String first, String last, String sid, String grade, District d, School s) {
        Student st = new Student();
        st.setId(id);
        st.setFirstName(first);
        st.setLastName(last);
        st.setStudentId(sid);
        st.setGrade(grade);
        st.setDistrict(d);
        st.setSchool(s);
        st.setIncidents(new ArrayList<>());
        st.setInterventions(new ArrayList<>());
        return st;
    }
}
