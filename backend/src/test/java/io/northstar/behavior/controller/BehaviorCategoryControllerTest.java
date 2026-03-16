package io.northstar.behavior.controller;

import io.northstar.behavior.dto.BehaviorCategoryDTO;
import io.northstar.behavior.service.BehaviorCategoryService;
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
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = BehaviorCategoryController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("BehaviorCategoryController — MockMvc tests")
class BehaviorCategoryControllerTest {

    @Autowired
    MockMvc mvc;

    @MockBean
    BehaviorCategoryService service;

    // BehaviorCategoryDTO record: (Long id, String name, String description, String tier, String severity, Long schoolId, Long districtId)
    @Test
    @DisplayName("GET /api/behavior-categories → 200 with list of DTOs")
    void getAll_returnsList() throws Exception {
        var dto1 = new BehaviorCategoryDTO(1L, "Disruption", "Classroom disruption", "Tier 1", "Minor", null, 10L);
        var dto2 = new BehaviorCategoryDTO(2L, "Fighting",   "Physical altercation",  "Tier 3", "Major", null, 10L);
        when(service.findAll()).thenReturn(List.of(dto1, dto2));

        mvc.perform(get("/api/behavior-categories").accept(MediaType.APPLICATION_JSON)
                        .header("X-District-Id", "10"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("Disruption"))
                .andExpect(jsonPath("$[0].severity").value("Minor"))
                .andExpect(jsonPath("$[0].tier").value("Tier 1"))
                .andExpect(jsonPath("$[0].districtId").value(10))
                .andExpect(jsonPath("$[1].name").value("Fighting"))
                .andExpect(jsonPath("$[1].severity").value("Major"));
    }

    @Test
    @DisplayName("GET /api/behavior-categories → 200 with empty list when none exist")
    void getAll_empty() throws Exception {
        when(service.findAll()).thenReturn(List.of());

        mvc.perform(get("/api/behavior-categories").accept(MediaType.APPLICATION_JSON)
                        .header("X-District-Id", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("POST /api/behavior-categories → 201 Created with saved DTO")
    void create_returns201() throws Exception {
        var created = new BehaviorCategoryDTO(3L, "Tardiness", "Late to class", "Tier 1", "Low", null, 10L);
        // service.create(Long districtId, CreateBehaviorCategoryRequest req)
        when(service.create(anyLong(), any())).thenReturn(created);

        mvc.perform(post("/api/behavior-categories")
                        .header("X-District-Id", "10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Tardiness",
                                  "severity": "Low",
                                  "tier": "Tier 1",
                                  "description": "Late to class",
                                  "schoolId": 5
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.name").value("Tardiness"));
    }

    @Test
    @DisplayName("GET /api/behavior-categories/{id} → 200 with single DTO")
    void getById_ok() throws Exception {
        var dto = new BehaviorCategoryDTO(1L, "Disruption", "desc", "Tier 1", "Minor", null, 10L);
        when(service.findById(1L)).thenReturn(dto);

        mvc.perform(get("/api/behavior-categories/1").accept(MediaType.APPLICATION_JSON)
                        .header("X-District-Id", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Disruption"));
    }

    @Test
    @DisplayName("DELETE /api/behavior-categories/{id} → 204 No Content")
    void delete_returns204() throws Exception {
        mvc.perform(delete("/api/behavior-categories/1")
                        .header("X-District-Id", "10"))
                .andExpect(status().isNoContent());
    }
}
