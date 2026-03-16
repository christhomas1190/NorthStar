package io.northstar.behavior.controller;

import io.northstar.behavior.dto.IncidentDTO;
import io.northstar.behavior.dto.IncidentSummaryDTO;
import io.northstar.behavior.service.IncidentService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = IncidentController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("IncidentController — MockMvc tests")
class IncidentControllerTest {

    @Autowired
    MockMvc mvc;

    @MockBean
    IncidentService service;

    static final OffsetDateTime TS = OffsetDateTime.parse("2025-03-01T09:00:00Z");

    private IncidentDTO dto(long id, long studentId, String category, String severity) {
        return new IncidentDTO(id, studentId, category, "desc", severity, "teacher1", TS, TS, 10L);
    }

    // ---------- GET /api/incidents ----------

    @Test
    @DisplayName("GET /api/incidents → 200 with list")
    void getAll_returnsList() throws Exception {
        when(service.findAll()).thenReturn(List.of(
                dto(1L, 10L, "Disruption", "Minor"),
                dto(2L, 11L, "Fighting",   "High")
        ));

        mvc.perform(get("/api/incidents").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].category").value("Disruption"))
                .andExpect(jsonPath("$[1].category").value("Fighting"));
    }

    @Test
    @DisplayName("GET /api/incidents → 200 with empty list")
    void getAll_empty() throws Exception {
        when(service.findAll()).thenReturn(List.of());
        mvc.perform(get("/api/incidents").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    // ---------- GET /api/incidents/{id} ----------

    @Test
    @DisplayName("GET /api/incidents/{id} → 200 with single DTO")
    void getById_ok() throws Exception {
        when(service.findById(5L)).thenReturn(dto(5L, 10L, "Bullying", "High"));

        mvc.perform(get("/api/incidents/5").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.category").value("Bullying"))
                .andExpect(jsonPath("$.severity").value("High"))
                .andExpect(jsonPath("$.reportedBy").value("teacher1"));
    }

    // ---------- POST /api/incidents ----------

    @Test
    @DisplayName("POST /api/incidents → 201 Created with saved DTO")
    void create_returns201() throws Exception {
        when(service.create(any())).thenReturn(dto(99L, 10L, "Disruption", "Minor"));

        mvc.perform(post("/api/incidents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "studentId": 10,
                                  "category": "Disruption",
                                  "description": "Talking",
                                  "severity": "Minor",
                                  "reportedBy": "teacher1"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(99))
                .andExpect(jsonPath("$.category").value("Disruption"));
    }

    // ---------- GET /api/incidents/student/{studentId}/summary ----------

    @Test
    @DisplayName("GET /api/incidents/student/{id}/summary → 200 with summaries")
    void studentSummary_returnsList() throws Exception {
        when(service.summaryForStudent(10L)).thenReturn(List.of(
                new IncidentSummaryDTO(1L, "Disruption", "Minor", TS, 10L),
                new IncidentSummaryDTO(2L, "Tardiness",  "Low",   TS, 10L)
        ));

        mvc.perform(get("/api/incidents/student/10/summary").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].category").value("Disruption"))
                .andExpect(jsonPath("$[1].category").value("Tardiness"));
    }

    // ---------- DELETE /api/incidents/{id} ----------

    @Test
    @DisplayName("DELETE /api/incidents/{id} → 204 No Content")
    void delete_returns204() throws Exception {
        mvc.perform(delete("/api/incidents/1"))
                .andExpect(status().isNoContent());

        verify(service).delete(1L);
    }
}
