package io.northstar.behavior;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.northstar.behavior.controller.StudentController;
import io.northstar.behavior.dto.IncidentSummaryDTO;
import io.northstar.behavior.dto.InterventionSummaryDTO;
import io.northstar.behavior.dto.StudentDTO;
import io.northstar.behavior.model.Intervention;
import io.northstar.behavior.model.Student;
import io.northstar.behavior.service.StudentService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
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
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
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

    // --- helpers (only used locally; safe to keep) ---

    private Intervention intervention(long id, long studentId, String tier, String strategy) {
        Intervention iv = new Intervention();
        iv.setId(id);

        // Relate to Student entity (setter now requires an argument)
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
        // Given: service will return a fully-populated StudentDTO
        var returned = new StudentDTO(
                10L,                       // id
                "Ada",                     // firstName
                "Lovelace",                // lastName
                "A12345",                  // studentId
                "8",                       // grade
                List.of(                   // incidents
                        new IncidentSummaryDTO(
                                1L,
                                "Disruption",
                                "Minor",
                                OffsetDateTime.parse("2025-01-01T12:00:00Z"),
                                10L                // districtId on the incident
                        )
                ),
                List.of(                   // interventions
                        new InterventionSummaryDTO(
                                7L,
                                "Tier 1",
                                "Check-in/Check-out",
                                LocalDate.parse("2025-01-02"),
                                null,              // endDate
                                10L                // districtId on the intervention
                        )
                ),
                10L                        // student districtId
        );

        when(students.create(any(StudentDTO.class))).thenReturn(returned);

        // Minimal request body that maps to StudentDTO (id omitted)
        String reqBody = """
          {
            "firstName": "Ada",
            "lastName": "Lovelace",
            "studentId": "A12345",
            "grade": "8"
          }
        """;

        // When / Then
        mvc.perform(post("/api/students")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqBody))
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

        // Verify the controller called the service with the right DTO
        ArgumentCaptor<StudentDTO> cap = ArgumentCaptor.forClass(StudentDTO.class);
        verify(students).create(cap.capture());
        StudentDTO sent = cap.getValue();
        assertEquals("Ada", sent.firstName());
        assertEquals("Lovelace", sent.lastName());
        assertEquals("A12345", sent.studentId());
        assertEquals("8", sent.grade());
    }

    @Test
    void createStudent_validationError_400() throws Exception {
        // Send clearly invalid JSON (missing required fields)
        String badJson = """
          { "firstName": "", "lastName": "", "studentId": "", "grade": "" }
        """;
        mvc.perform(post("/api/students")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(badJson))
                .andExpect(status().isBadRequest());
    }
}
