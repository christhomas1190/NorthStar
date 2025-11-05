package io.northstar.behavior;

import io.northstar.behavior.controller.BehaviorCategoryController;
import io.northstar.behavior.dto.BehaviorCategoryDTO;
import io.northstar.behavior.service.BehaviorCategoryService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = BehaviorCategoryController.class)
@AutoConfigureMockMvc(addFilters = false)
class BehaviorCategoryControllerTest {

    @Autowired
    MockMvc mvc;

    @MockBean
    BehaviorCategoryService service;

    @Test
    @DisplayName("GET /api/behavior-categories returns list with districtId")
    void getAll_returnsList() throws Exception {
        var createdAt = OffsetDateTime.parse("2025-01-01T12:00:00Z");

        // BehaviorCategoryDTO signature:
        // (Long id, String name, String severity, String tier, String description, OffsetDateTime createdAt, Long districtId)
        var dto1 = new BehaviorCategoryDTO(
                1L, "Disruption", "Minor", "Tier 1", "Classroom disruption",
                createdAt, 10L
        );
        var dto2 = new BehaviorCategoryDTO(
                2L, "Fighting", "Major", "Tier 3", "Physical altercation",
                createdAt, 10L
        );

        when(service.findAll()).thenReturn(List.of(dto1, dto2));

        mvc.perform(get("/api/behavior-categories").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("Disruption"))
                .andExpect(jsonPath("$[0].severity").value("Minor"))
                .andExpect(jsonPath("$[0].tier").value("Tier 1"))
                .andExpect(jsonPath("$[0].districtId").value(10));
    }
}
