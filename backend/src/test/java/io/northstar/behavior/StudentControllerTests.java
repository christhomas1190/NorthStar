package io.northstar.behavior;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.northstar.behavior.controller.StudentController;
import io.northstar.behavior.dto.CreateStudentRequest;
import io.northstar.behavior.model.Incident;
import io.northstar.behavior.model.Intervention;
import io.northstar.behavior.model.Student;
import io.northstar.behavior.service.StudentService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = StudentController.class)
@AutoConfigureMockMvc(addFilters = false)
public class StudentControllerTests {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean StudentService students;

    // --- helpers: build domain objects that service returns ---

    private Student student(long id, String first, String last, String sid, String grade,
                            List<Incident> incs, List<Intervention> ivs) {
        Student s = new Student();
        s.setId(id);
        s.setFirstName(first);
        s.setLastName(last);
        s.setStudentId(sid);
        s.setGrade(grade);
        s.setIncidents(incs != null ? incs : new ArrayList<>());
        s.setInterventions(ivs != null ? ivs : new ArrayList<>());
        return s;
    }

    private Incident incident(long id, long studentId, String category, String severity) {
        Incident inc = new Incident();
        inc.setId(id);
        inc.setStudentId(studentId);
        inc.setCategory(category);
        inc.setDescription("desc");
        inc.setSeverity(severity);
        inc.setReportedBy("Teacher A");
        inc.setOccurredAt(OffsetDateTime.parse("2025-09-01T08:00:00Z")); // past -> OK for @PastOrPresent
        inc.setCreatedAt(OffsetDateTime.parse("2025-09-01T09:00:00Z"));
        return inc;
    }

    private Intervention intervention(long id, long studentId, String tier, String strategy) {
        Intervention iv = new Intervention();
        iv.setId(id);

        // UPDATED: relate to Student entity instead of using setStudentId(...)
        Student s = new Student();
        s.setId(studentId);
        iv.setStudent(s);

        iv.setTier(tier);
        iv.setStrategy(strategy);
        iv.setAssignedBy("AP Jones");
        iv.setStartDate(LocalDate.of(2025, 9, 1));
        iv.setEndDate(LocalDate.of(2025, 9, 30));
        return iv;
    }

    @Test
    @DisplayName("POST /api/students => 201 Created with mapped incidents/interventions")
    void createStudent_created_201() throws Exception {
        // Given
        CreateStudentRequest req = new CreateStudentRequest("Ada", "Lovelace", "A12345", "8");

        Student returned = student(
                10L, "Ada", "Lovelace", "A12345", "8",
                List.of(incident(1L, 10L, "Disruption", "Minor")),
                List.of(intervention(7L, 10L, "Tier 1", "Check-in/Check-out"))
        );

        when(students.create(eq("Ada"), eq("Lovelace"), eq("A12345"), eq("8")))
                .thenReturn(returned);

        // When / Then
        mvc.perform(post("/api/students")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.firstName").value("Ada"))
                .andExpect(jsonPath("$.incidents", hasSize(1)))
                .andExpect(jsonPath("$.incidents[0].category").value("Disruption"))
                .andExpect(jsonPath("$.incidents[0].severity").value("Minor"))
                .andExpect(jsonPath("$.interventions", hasSize(1)))
                .andExpect(jsonPath("$.interventions[0].tier").value("Tier 1"))
                .andExpect(jsonPath("$.interventions[0].strategy").value("Check-in/Check-out"));

        verify(students).create("Ada", "Lovelace", "A12345", "8");
    }

    @Test
    void createStudent_validationError_400() throws Exception {
        var bad = new CreateStudentRequest("", "", "", "");
        mvc.perform(post("/api/students")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bad)))
                .andExpect(status().isBadRequest());
    }
}
