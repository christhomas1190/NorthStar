package io.northstar.behavior;

import io.northstar.behavior.dto.StudentDTO;
import io.northstar.behavior.model.District;
import io.northstar.behavior.model.Student;
import io.northstar.behavior.repository.DistrictRepository;
import io.northstar.behavior.repository.StudentRepository;
import io.northstar.behavior.service.StudentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

    class StudentServiceTests {

        private StudentRepository studentRepo;
        private DistrictRepository districtRepo;
        private StudentServiceImpl service;

        private District district1;
        private District district2;

        @BeforeEach
        void setup() {
            studentRepo = mock(StudentRepository.class);
            districtRepo = mock(DistrictRepository.class);
            service = new StudentServiceImpl(studentRepo, districtRepo);

            // Mock districts
            district1 = new District();
            district1.setDistrictId(1L);
            district1.setDistrictName("North District");

            district2 = new District();
            district2.setDistrictId(2L);
            district2.setDistrictName("South District");
        }

        @Test
        void create_assignsDistrictProperly() {
            // simulate current district in context
            TenantContext.setDistrictId(1L);

            // Mock repository behavior
            when(studentRepo.existsByStudentIdAndDistrict_DistrictId("S123", 1L)).thenReturn(false);
            when(districtRepo.getReferenceById(1L)).thenReturn(district1);
            when(studentRepo.save(any(Student.class))).thenAnswer(invocation -> {
                Student s = invocation.getArgument(0);
                s.setId(99L);
                return s;
            });

            StudentDTO dto = new StudentDTO(null, "Marcus", "Lee", "S123", "7", 1L);
            StudentDTO saved = service.create(dto);

            assertNotNull(saved);
            assertEquals("Marcus", saved.firstName());
            assertEquals(1L, saved.districtId());

            // verify district is set
            ArgumentCaptor<Student> captor = ArgumentCaptor.forClass(Student.class);
            verify(studentRepo).save(captor.capture());
            assertEquals(1L, captor.getValue().getDistrict().getDistrictId());
        }

        @Test
        void findAll_returnsOnlyStudentsFromCurrentDistrict() {
            TenantContext.setDistrictId(1L);

            // Create two students, one in each district
            Student s1 = new Student();
            s1.setId(1L);
            s1.setFirstName("Marcus");
            s1.setLastName("Lee");
            s1.setStudentId("S123");
            s1.setGrade("7");
            s1.setDistrict(district1);

            Student s2 = new Student();
            s2.setId(2L);
            s2.setFirstName("Sofia");
            s2.setLastName("Perez");
            s2.setStudentId("S234");
            s2.setGrade("7");
            s2.setDistrict(district2);

            // Repo should only return students in district 1
            when(studentRepo.findByDistrict_DistrictId(1L)).thenReturn(List.of(s1));

            List<StudentDTO> results = service.findAll();

            assertEquals(1, results.size());
            assertEquals("Marcus", results.get(0).firstName());
            verify(studentRepo).findByDistrict_DistrictId(1L);
        }

        @Test
        void findById_rejectsCrossDistrictAccess() {
            TenantContext.setDistrictId(1L);

            Student s = new Student();
            s.setId(10L);
            s.setFirstName("Jayden");
            s.setLastName("Cole");
            s.setStudentId("S999");
            s.setDistrict(district2); // wrong district

            when(studentRepo.findByIdAndDistrict_DistrictId(10L, 1L)).thenReturn(Optional.empty());

            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> service.findById(10L));

            assertEquals(404, ex.getStatusCode().value());
            verify(studentRepo).findByIdAndDistrict_DistrictId(10L, 1L);
        }

        @Test
        void create_throwsIfNoDistrictContext() {
            TenantContext.clear();
            StudentDTO dto = new StudentDTO(null, "Ava", "Johnson", "S456", "8", null);

            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> service.create(dto));

            assertEquals(401, ex.getStatusCode().value());
        }

}
