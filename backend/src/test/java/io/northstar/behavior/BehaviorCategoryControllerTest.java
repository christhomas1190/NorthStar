package io.northstar.behavior;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.northstar.behavior.controller.BehaviorCategoryController;
import io.northstar.behavior.dto.BehaviorCategoryDTO;
import io.northstar.behavior.model.BehaviorCategory;
import io.northstar.behavior.service.BehaviorCategoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(BehaviorCategoryController.class)
@AutoConfigureMockMvc(addFilters = false)
public class BehaviorCategoryControllerTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;

    @MockBean BehaviorCategoryService service;

    private BehaviorCategory sample;

    @BeforeEach
    void setup() {
        sample = new BehaviorCategory("Disruption", "Low", "Tier 1", "Minor classroom interruption");
        sample.setId(1L);
    }

    @Test
    @DisplayName("POST /api/behavior-categories -> 201 Created")
    void createCategory() throws Exception {
        when(service.create(any(), any(), any(), any())).thenReturn(sample);

        BehaviorCategoryDTO req = new BehaviorCategoryDTO(null, "Disruption", "Low", "Tier 1", "Minor classroom interruption", null);

        mvc.perform(post("/api/behavior-categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Disruption"));
    }

    @Test
    @DisplayName("GET /api/behavior-categories -> 200 OK with list")
    void getAllCategories() throws Exception {
        when(service.list()).thenReturn(List.of(sample));

        mvc.perform(get("/api/behavior-categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Disruption"));
    }

    @Test
    @DisplayName("GET /api/behavior-categories/{id} -> 200 OK")
    void getCategoryById() throws Exception {
        when(service.getById(1L)).thenReturn(sample);

        mvc.perform(get("/api/behavior-categories/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @DisplayName("PUT /api/behavior-categories/{id} -> 200 OK")
    void updateCategory() throws Exception {
        BehaviorCategory updated = new BehaviorCategory("Defiance", "Moderate", "Tier 2", "Escalated behavior");
        updated.setId(1L);
        when(service.update(eq(1L), any(), any(), any(), any())).thenReturn(updated);

        BehaviorCategoryDTO req = new BehaviorCategoryDTO(null, "Defiance", "Moderate", "Tier 2", "Escalated behavior", null);

        mvc.perform(put("/api/behavior-categories/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Defiance"))
                .andExpect(jsonPath("$.tier").value("Tier 2"));
    }

    @Test
    @DisplayName("DELETE /api/behavior-categories/{id} -> 204 No Content")
    void deleteCategory() throws Exception {
        doNothing().when(service).delete(1L);

        mvc.perform(delete("/api/behavior-categories/1"))
                .andExpect(status().isNoContent());
    }
}
