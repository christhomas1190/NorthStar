package io.northstar.behavior.service;

import io.northstar.behavior.dto.CreateTeacherRequest;
import io.northstar.behavior.dto.TeacherDTO;
import io.northstar.behavior.model.Admin;
import io.northstar.behavior.model.District;
import io.northstar.behavior.model.School;
import io.northstar.behavior.model.Teacher;
import io.northstar.behavior.repository.AdminRepository;
import io.northstar.behavior.repository.DistrictRepository;
import io.northstar.behavior.repository.IncidentRepository;
import io.northstar.behavior.repository.SchoolRepository;
import io.northstar.behavior.repository.TeacherRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@DisplayName("TeacherService — unit tests")
class TeacherServiceTest {

    TeacherRepository         repo;
    DistrictRepository        districtRepository;
    SchoolRepository          schoolRepository;
    AdminRepository           adminRepository;
    IncidentRepository        incidentRepository;
    io.northstar.behavior.repository.GradeCategoryRepository gradeCategoryRepo;
    TeacherServiceImpl        service;

    static final Long DID = 10L;
    static final Long SID = 5L;

    @BeforeEach
    void setUp() {
        repo              = mock(TeacherRepository.class);
        districtRepository = mock(DistrictRepository.class);
        schoolRepository   = mock(SchoolRepository.class);
        adminRepository    = mock(AdminRepository.class);
        incidentRepository = mock(IncidentRepository.class);
        gradeCategoryRepo  = mock(io.northstar.behavior.repository.GradeCategoryRepository.class);

        service = new TeacherServiceImpl(repo, districtRepository, schoolRepository,
                adminRepository, incidentRepository, gradeCategoryRepo);

        // inject defaultTeacherPassword (bypasses @Value for unit tests)
        try {
            var f = TeacherServiceImpl.class.getDeclaredField("defaultTeacherPassword");
            f.setAccessible(true);
            f.set(service, "TestPass!2025");
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    // ---------- createForCurrentAdmin: username generation ----------

    @Test
    @DisplayName("createForCurrentAdmin: generates username = firstInitial + lastName")
    void create_generatesUsername_firstInitialLast() {
        stubAdmin();
        when(repo.existsByEmail("john.doe@school.org")).thenReturn(false);
        when(repo.existsByUserName("jdoe")).thenReturn(false);
        stubSave();

        TeacherDTO out = service.createForCurrentAdmin(req("John", "Doe", "john.doe@school.org"));

        assertEquals("jdoe", out.userName());
        assertEquals("John", out.firstName());
        assertEquals("Doe",  out.lastName());
        assertEquals(DID,    out.districtId());
    }

    @Test
    @DisplayName("createForCurrentAdmin: first collision → uses first two initials + lastName")
    void create_usernameCollision_usesTwoInitials() {
        stubAdmin();
        when(repo.existsByEmail("james.doe@school.org")).thenReturn(false);
        when(repo.existsByUserName("jdoe")).thenReturn(true);
        when(repo.existsByUserName("jadoe")).thenReturn(false);
        stubSave();

        TeacherDTO out = service.createForCurrentAdmin(req("James", "Doe", "james.doe@school.org"));
        assertEquals("jadoe", out.userName());
    }

    @Test
    @DisplayName("createForCurrentAdmin: two-letter collision → appends numeric suffix")
    void create_usernameCollision_numericSuffix() {
        stubAdmin();
        when(repo.existsByEmail("jane.doe@school.org")).thenReturn(false);
        when(repo.existsByUserName("jdoe")).thenReturn(true);
        when(repo.existsByUserName("jadoe")).thenReturn(true);
        when(repo.existsByUserName("jadoe1")).thenReturn(true);
        when(repo.existsByUserName("jadoe2")).thenReturn(false);
        stubSave();

        TeacherDTO out = service.createForCurrentAdmin(req("Jane", "Doe", "jane.doe@school.org"));
        assertEquals("jadoe2", out.userName());
    }

    @Test
    @DisplayName("createForCurrentAdmin: diacritics and special chars normalized in username")
    void create_normalizesDiacritics() {
        stubAdmin();
        when(repo.existsByEmail("jose.nunez@school.org")).thenReturn(false);
        when(repo.existsByUserName("jnunez")).thenReturn(false);
        stubSave();

        TeacherDTO out = service.createForCurrentAdmin(req("José", "Núñez", "jose.nunez@school.org"));
        assertEquals("jnunez", out.userName());
    }

    @Test
    @DisplayName("createForCurrentAdmin: email collision → 409 Conflict")
    void create_emailConflict_throws409() {
        stubAdmin();
        when(repo.existsByEmail("dup@school.org")).thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.createForCurrentAdmin(req("A", "B", "dup@school.org")));
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
    }

    @Test
    @DisplayName("createForCurrentAdmin: password is bcrypt-hashed")
    void create_passwordIsBcryptHashed() {
        stubAdmin();
        when(repo.existsByEmail("hash.test@school.org")).thenReturn(false);
        when(repo.existsByUserName("htest")).thenReturn(false);
        stubSave();

        service.createForCurrentAdmin(req("Hash", "Test", "hash.test@school.org"));

        ArgumentCaptor<Teacher> cap = ArgumentCaptor.forClass(Teacher.class);
        verify(repo).save(cap.capture());
        String hash = cap.getValue().getPasswordHash();
        assertNotNull(hash);
        assertTrue(hash.startsWith("$2a$") || hash.startsWith("$2b$"),
                "Expected bcrypt hash, got: " + hash);
    }

    // ---------- update ----------

    @Test
    @DisplayName("update: changes name and email successfully")
    void update_ok() {
        District d = district(DID);
        School   s = school(SID, d);
        Teacher  existing = teacher(10L, "John", "Doe", "john.doe@school.org", "jdoe", d, s);

        when(repo.findById(10L)).thenReturn(Optional.of(existing));
        when(repo.existsByEmail("johnny.doe@school.org")).thenReturn(false);
        when(schoolRepository.findById(SID)).thenReturn(Optional.of(s));

        TeacherDTO out = service.update(10L,
                new TeacherDTO(null, "Johnny", "Doe", "johnny.doe@school.org", null, DID, SID));

        assertEquals("Johnny",              out.firstName());
        assertEquals("johnny.doe@school.org", out.email());
        assertEquals("jdoe",               out.userName()); // username unchanged
    }

    @Test
    @DisplayName("update: new email already taken → 409 Conflict")
    void update_emailConflict_throws409() {
        District d = district(DID);
        School   s = school(SID, d);
        Teacher  existing = teacher(11L, "John", "Doe", "john.doe@school.org", "jdoe", d, s);

        when(repo.findById(11L)).thenReturn(Optional.of(existing));
        when(repo.existsByEmail("taken@school.org")).thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.update(11L,
                        new TeacherDTO(null, "John", "Doe", "taken@school.org", null, DID, SID)));
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
    }

    @Test
    @DisplayName("update: teacher not found → 404")
    void update_notFound_throws404() {
        when(repo.findById(999L)).thenReturn(Optional.empty());
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.update(999L,
                        new TeacherDTO(null, "A", "B", "a@b.com", null, DID, SID)));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    // ---------- findAll ----------

    @Test
    @DisplayName("findAll: returns all teachers as DTOs")
    void findAll_returnsList() {
        District d = district(DID);
        School   s = school(SID, d);
        List<Teacher> db = new ArrayList<>();
        for (int i = 0; i < 3; i++) {
            db.add(teacher((long)(i + 1), "F" + i, "L" + i, "f" + i + "@test.com", "fl" + i, d, s));
        }
        when(repo.findAll()).thenReturn(db);

        List<TeacherDTO> list = service.findAll();
        assertEquals(3, list.size());
        for (TeacherDTO dto : list) assertEquals(DID, dto.districtId());
    }

    // ---------- findById ----------

    @Test
    @DisplayName("findById: found → returns DTO")
    void findById_ok() {
        District d = district(DID);
        School   s = school(SID, d);
        when(repo.findById(1L)).thenReturn(Optional.of(teacher(1L, "F", "L", "f@l.com", "fl", d, s)));

        TeacherDTO out = service.findById(1L);
        assertEquals(1L, out.id());
        assertEquals(DID, out.districtId());
    }

    @Test
    @DisplayName("findById: missing → 404")
    void findById_notFound_throws404() {
        when(repo.findById(999L)).thenReturn(Optional.empty());
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.findById(999L));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    // ---------- delete ----------

    @Test
    @DisplayName("delete: existing teacher → deleteById invoked")
    void delete_ok() {
        when(repo.existsById(1L)).thenReturn(true);
        service.delete(1L);
        verify(repo).deleteById(1L);
    }

    @Test
    @DisplayName("delete: not found → 404")
    void delete_notFound_throws404() {
        when(repo.existsById(321L)).thenReturn(false);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.delete(321L));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    // ---------- helpers ----------

    /** Stubs adminRepository.findAll() to return an admin in DID/SID scope */
    private void stubAdmin() {
        District d = district(DID);
        School   s = school(SID, d);
        Admin admin = new Admin();
        admin.setId(1L);
        admin.setDistrict(d);
        admin.setSchool(s);
        when(adminRepository.findAll()).thenReturn(List.of(admin));
        when(schoolRepository.findById(SID)).thenReturn(Optional.of(s));
        when(districtRepository.getReferenceById(DID)).thenReturn(d);
    }

    private void stubSave() {
        when(repo.save(any(Teacher.class))).thenAnswer(inv -> {
            Teacher t = inv.getArgument(0);
            if (t.getId() == null) t.setId(99L);
            return t;
        });
    }

    private CreateTeacherRequest req(String first, String last, String email) {
        return new CreateTeacherRequest(first, last, email);
    }

    private District district(Long id) {
        District d = new District();
        d.setDistrictId(id);
        d.setDistrictName("D-" + id);
        return d;
    }

    private School school(Long id, District d) {
        School s = new School();
        s.setSchoolId(id);
        s.setSchoolName("School-" + id);
        s.setDistrict(d);
        return s;
    }

    private Teacher teacher(Long id, String first, String last, String email, String username, District d, School s) {
        Teacher t = new Teacher();
        t.setId(id);
        t.setFirstName(first);
        t.setLastName(last);
        t.setEmail(email);
        t.setUserName(username);
        t.setPasswordHash("$2a$10$hash");
        t.setDistrict(d);
        t.setSchool(s);
        return t;
    }
}
