package io.northstar.behavior;

import io.northstar.behavior.controller.BehaviorCategoryController;
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

import java.time.OffsetDateTime;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = BehaviorCategoryController.class)
@AutoConfigureMockMvc(addFilters = false)
class BehaviorCategoryControllerTest {

    @Autowired MockMvc mvc;

    @MockBean BehaviorCategoryService service;

    private BehaviorCategoryDTO dto(long id, String name, String desc, String severity, String tier) {
        return new BehaviorCategoryDTO(
                id,
                name,
                severity,  // 3rd param is severity
                tier,      // 4th is tier
                desc,      // 5th is description
                OffsetDateTime.parse("2025-01-01T00:00:00Z")
        );
    }

    @Test
    @DisplayName("GET /api/behaviors returns a list")
    void findAll_returnsList() throws Exception {
        var a = dto(1, "Disruption", "Off-task behavior", "Minor", "Tier 1");
        var b = dto(2, "Defiance", "Refusal to comply", "Major", "Tier 2");

        when(service.findAll()).thenReturn(List.of(a, b));

        mvc.perform(get("/api/behaviors"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("Disruption"))
                .andExpect(jsonPath("$[1].id").value(2));
    }

    @Test
    @DisplayName("GET /api/behaviors/{id} returns one item")
    void findById_returnsOne() throws Exception {
        var out = dto(10, "Disruption", "desc", "Minor", "Tier 1");
        when(service.findById(10L)).thenReturn(out);

        mvc.perform(get("/api/behaviors/10"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.name").value("Disruption"));
    }

    @Test
    @DisplayName("POST /api/behaviors creates and returns item with Location header")
    void create_returnsCreated() throws Exception {
        // client payload (id/createdAt may be null)
        var incoming = """
            {"id":null,"name":"Tardy","description":"Late to class","severity":"Minor","tier":"Tier 1","createdAt":null}
            """;

        var saved = dto(99, "Tardy", "Late to class", "Minor", "Tier 1");
        when(service.create(any(BehaviorCategoryDTO.class))).thenReturn(saved);

        mvc.perform(post("/api/behaviors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(incoming))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/behaviors/99"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(99))
                .andExpect(jsonPath("$.name").value("Tardy"));
    }

    @Test
    @DisplayName("PUT /api/behaviors/{id} updates and returns item")
    void update_returnsUpdated() throws Exception {
        var body = """
            {"id":10,"name":"Defiance","description":"Updated","severity":"Major","tier":"Tier 2","createdAt":"2025-01-01T00:00:00Z"}
            """;
        var updated = dto(10, "Defiance", "Updated", "Major", "Tier 2");

        when(service.update(eq(10L), any(BehaviorCategoryDTO.class))).thenReturn(updated);

        mvc.perform(put("/api/behaviors/10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.name").value("Defiance"))
                .andExpect(jsonPath("$.description").value("Updated"));
    }

    @Test
    @DisplayName("DELETE /api/behaviors/{id} returns 204")
    void delete_noContent() throws Exception {
        doNothing().when(service).delete(7L);

        mvc.perform(delete("/api/behaviors/7"))
                .andExpect(status().isNoContent());
    }
}
