//package io.northstar.behavior;
//
//import io.northstar.behavior.dto.IncidentSummaryDTO;
//import io.northstar.behavior.dto.InterventionSummaryDTO;
//import io.northstar.behavior.dto.StudentDTO;
//import io.northstar.behavior.model.District;
//import io.northstar.behavior.model.Student;
//import io.northstar.behavior.repository.DistrictRepository;
//import io.northstar.behavior.repository.StudentRepository;
//import io.northstar.behavior.service.StudentService;
//import io.northstar.behavior.service.StudentServiceImpl;
//import io.northstar.behavior.tenant.TenantContext;
//import org.junit.jupiter.api.*;
//import org.mockito.ArgumentCaptor;
//
//import java.time.LocalDate;
//import java.time.OffsetDateTime;
//import java.util.ArrayList;
//import java.util.List;
//import java.util.Optional;
//
//import static org.junit.jupiter.api.Assertions.*;
//import static org.mockito.Mockito.*;
//
///**
// * Unit tests for StudentServiceImpl matching the current StudentDTO signature:
// * (long id, String firstName, String lastName, String studentId, String grade,
// *  List<IncidentSummaryDTO> incidents, List<InterventionSummaryDTO> interventions, Long districtId)
// */
//class StudentServiceTests {
//
//    StudentRepository studentRepo;
//    DistrictRepository districtRepo;
//    StudentService service;
//
//    @BeforeEach
//    void setUp() {
//        studentRepo = mock(StudentRepository.class);
//        districtRepo = mock(DistrictRepository.class);
//        service = new StudentServiceImpl(studentRepo, districtRepo);
//
//        // Simulate multitenant context with districtId=10
//        TenantContext.setDistrictId(10L);
//    }
//
//    @AfterEach
//    void tearDown() {
//        TenantContext.clear();
//    }
//
//    @Test
//    void create_student_ok() {
//        // Given DTO with empty lists + districtId
//        StudentDTO incoming = new StudentDTO(
//                0L, "Ada", "Lovelace", "A12345", "8",
//                List.of(), List.of(), 10L
//        );
//
//        // District exists
//        District d = new District();
//        d.setDistrictId(10L);
//        when(districtRepo.getReferenceById(10L)).thenReturn(d);
//
//        // No duplicate studentId for district
//        when(studentRepo.existsByStudentIdAndDistrict_DistrictId("A12345", 10L)).thenReturn(false);
//
//        // Save returns entity
//        Student saved = new Student();
//        saved.setId(42L);
//        saved.setFirstName("Ada");
//        saved.setLastName("Lovelace");
//        saved.setStudentId("A12345");
//        saved.setGrade("8");
//        saved.setDistrict(d);
//        when(studentRepo.save(any(Student.class))).thenReturn(saved);
//
//        // When
//        StudentDTO out = service.create(incoming);
//
//        // Then
//        assertEquals(42L, out.id());
//        assertEquals("Ada", out.firstName());
//        assertEquals("Lovelace", out.lastName());
//        assertEquals("A12345", out.studentId());
//        assertEquals("8", out.grade());
//        assertEquals(10L, out.districtId());
//    }
//
//    @Test
//    void update_student_names_ok() {
//        // Existing in district 10
//        District d = new District();
//        d.setDistrictId(10L);
//
//        Student existing = new Student();
//        existing.setId(100L);
//        existing.setFirstName("Alan");
//        existing.setLastName("Turing");
//        existing.setStudentId("T100");
//        existing.setGrade("7");
//        existing.setDistrict(d);
//
//        when(studentRepo.findByIdAndDistrict_DistrictId(100L, 10L))
//                .thenReturn(Optional.of(existing));
//
//        // Incoming DTO (only names updated)
//        StudentDTO patch = new StudentDTO(
//                100L, "Al", "Tur", "T100", "7",
//                List.of(), List.of(), 10L
//        );
//
//        // When
//        StudentDTO out = service.update(100L, patch);
//
//        // Then (managed entity mutated)
//        assertEquals("Al", out.firstName());
//        assertEquals("Tur", out.lastName());
//        assertEquals("T100", out.studentId());
//        assertEquals("7", out.grade());
//        assertEquals(10L, out.districtId());
//    }
//
//    @Test
//    void findAll_scopedByDistrict() {
//        District d10 = new District(); d10.setDistrictId(10L);
//
//        Student s1 = new Student();
//        s1.setId(1L);
//        s1.setFirstName("Grace");
//        s1.setLastName("Hopper");
//        s1.setStudentId("G100");
//        s1.setGrade("6");
//        s1.setDistrict(d10);
//
//        when(studentRepo.findByDistrict_DistrictId(10L)).thenReturn(List.of(s1));
//
//        List<StudentDTO> list = service.findAll();
//        assertEquals(1, list.size());
//        assertEquals("Grace", list.get(0).firstName());
//        assertEquals(10L, list.get(0).districtId());
//    }
//
//    @Test
//    void toDto_containsIncidentAndInterventionSummaries() {
//        // Build summaries to match record signatures
//        var inc = new IncidentSummaryDTO(
//                5L, "Disruption", "Minor",
//                OffsetDateTime.parse("2025-01-01T12:00:00Z"),
//                10L
//        );
//        var iv = new InterventionSummaryDTO(
//                7L, "Tier 1", "Check-in/Check-out",
//                LocalDate.parse("2025-01-02"),
//                null,
//                10L
//        );
//
//        // Compose a StudentDTO using current signature
//        var dto = new StudentDTO(
//                10L, "Ada", "Lovelace", "A12345", "8",
//                List.of(inc), List.of(iv), 10L
//        );
//
//        // Basic assertions
//        assertEquals(10L, dto.id());
//        assertEquals(1, dto.incidents().size());
//        assertEquals("Disruption", dto.incidents().get(0).category());
//        assertEquals(1, dto.interventions().size());
//        assertEquals("Tier 1", dto.interventions().get(0).tier());
//    }
//}
