package io.northstar.behavior.controller;

import io.northstar.behavior.dto.CreateStudentRequest;
import io.northstar.behavior.dto.StudentDTO;
import io.northstar.behavior.service.IncidentService;
import io.northstar.behavior.service.StudentService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = StudentController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("StudentController — MockMvc tests")
class StudentControllerTest {

    @Autowired
    MockMvc mvc;

    @MockBean
    StudentService studentService;

    @MockBean
    IncidentService incidentService;

    private StudentDTO dto(long id, String first, String last, String sid, String grade) {
        return new StudentDTO(id, first, last, sid, grade, List.of(), List.of(), 10L, 5L, null);
    }

    // ---------- GET /api/students ----------

    @Test
    @DisplayName("GET /api/students → 200 with list of all students")
    void list_returnsAll() throws Exception {
        when(studentService.findAll()).thenReturn(List.of(
                dto(1L, "Ada",   "Lovelace", "A001", "8"),
                dto(2L, "Grace", "Hopper",   "G002", "9")
        ));

        mvc.perform(get("/api/students").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].firstName").value("Ada"))
                .andExpect(jsonPath("$[0].studentId").value("A001"))
                .andExpect(jsonPath("$[1].firstName").value("Grace"));
    }

    @Test
    @DisplayName("GET /api/students → 200 with empty list")
    void list_empty() throws Exception {
        when(studentService.findAll()).thenReturn(List.of());
        mvc.perform(get("/api/students").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    // ---------- GET /api/students/{id} ----------

    @Test
    @DisplayName("GET /api/students/{id} → 200 with single student DTO")
    void getById_ok() throws Exception {
        when(studentService.findById(1L)).thenReturn(dto(1L, "Ada", "Lovelace", "A001", "8"));

        mvc.perform(get("/api/students/1").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.firstName").value("Ada"))
                .andExpect(jsonPath("$.lastName").value("Lovelace"))
                .andExpect(jsonPath("$.grade").value("8"))
                .andExpect(jsonPath("$.districtId").value(10));
    }

    // ---------- POST /api/students ----------

    @Test
    @DisplayName("POST /api/students → 201 Created with saved DTO")
    void create_returns201() throws Exception {
        when(studentService.create(any(CreateStudentRequest.class))).thenReturn(dto(99L, "New", "Student", "N099", "7"));

        mvc.perform(post("/api/students")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "firstName": "New",
                                  "lastName": "Student",
                                  "studentId": "N099",
                                  "grade": "7",
                                  "schoolId": 5
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(99))
                .andExpect(jsonPath("$.firstName").value("New"))
                .andExpect(jsonPath("$.studentId").value("N099"));
    }

    // ---------- PUT /api/students/{id} ----------

    @Test
    @DisplayName("PUT /api/students/{id} → 200 with updated DTO")
    void update_ok() throws Exception {
        when(studentService.update(eq(1L), any()))
                .thenReturn(dto(1L, "Updated", "Name", "A001", "9"));

        mvc.perform(put("/api/students/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "id": 1,
                                  "firstName": "Updated",
                                  "lastName": "Name",
                                  "studentId": "A001",
                                  "grade": "9",
                                  "districtId": 10,
                                  "schoolId": 5
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Updated"))
                .andExpect(jsonPath("$.grade").value("9"));
    }

    // ---------- DELETE /api/students/{id} ----------

    @Test
    @DisplayName("DELETE /api/students/{id} → 204 No Content")
    void delete_returns204() throws Exception {
        mvc.perform(delete("/api/students/1"))
                .andExpect(status().isNoContent());

        verify(studentService).delete(1L);
    }

    // ---------- student-scoped incidents ----------

    @Test
    @DisplayName("POST /api/students/{id}/incidents → 201 Created")
    void createIncidentForStudent_returns201() throws Exception {
        when(incidentService.createForStudent(eq(1L), any(), any()))
                .thenReturn(new io.northstar.behavior.dto.IncidentDTO(
                        10L, 1L, "Disruption", "desc", "Minor", "teacher1",
                        java.time.OffsetDateTime.now(), java.time.OffsetDateTime.now(), 10L));

        mvc.perform(post("/api/students/1/incidents")
                        .header("X-District-Id", "10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "studentId": 1,
                                  "category": "Disruption",
                                  "description": "desc",
                                  "severity": "Minor",
                                  "reportedBy": "teacher1"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.category").value("Disruption"));
    }
}
