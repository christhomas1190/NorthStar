import com.fasterxml.jackson.databind.ObjectMapper;
import io.northstar.behavior.controller.BehaviorCategoryController;
import io.northstar.behavior.dto.BehaviorCategoryDTO;
import io.northstar.behavior.service.BehaviorCategoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = BehaviorCategoryController.class)
@AutoConfigureMockMvc(addFilters = false) // disable security filters for this slice test
class BehaviorCategoryControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private BehaviorCategoryService behaviorCategoryService;

    private BehaviorCategoryDTO createRequest;
    private BehaviorCategoryDTO createdResponse;
    private BehaviorCategoryDTO updateRequest;
    private BehaviorCategoryDTO updatedResponse;

    @BeforeEach
    void setUp() {
        createRequest = new BehaviorCategoryDTO(
                null,
                "Disruption",
                "Low",
                "Tier 1",
                "Low-level disruption in class"
        );

        createdResponse = new BehaviorCategoryDTO(
                1L,
                "Disruption",
                "Low",
                "Tier 1",
                "Low-level disruption in class"
        );

        updateRequest = new BehaviorCategoryDTO(
                null,
                "Disruption",
                "Moderate",
                "Tier 2",
                "Escalated disruption"
        );

        updatedResponse = new BehaviorCategoryDTO(
                1L,
                "Disruption",
                "Moderate",
                "Tier 2",
                "Escalated disruption"
        );
    }

    @Test
    @DisplayName("POST /api/behavior-categories -> 201 Created with body")
    void create_returnsCreated() throws Exception {
        when(behaviorCategoryService.create(any(BehaviorCategoryDTO.class)))
                .thenReturn(createdResponse);

        mockMvc.perform(
                        post("/api/behavior-categories")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(createRequest))
                )
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Disruption"))
                .andExpect(jsonPath("$.severity").value("Low"))
                .andExpect(jsonPath("$.tier").value("Tier 1"))
                .andExpect(jsonPath("$.description").value("Low-level disruption in class"));
    }

    @Test
    @DisplayName("GET /api/behavior-categories -> 200 OK with list")
    void getAll_returnsOkList() throws Exception {
        when(behaviorCategoryService.findAll()).thenReturn(List.of(createdResponse));

        mockMvc.perform(get("/api/behavior-categories").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("Disruption"))
                .andExpect(jsonPath("$[0].severity").value("Low"))
                .andExpect(jsonPath("$[0].tier").value("Tier 1"));
    }

    @Test
    @DisplayName("PUT /api/behavior-categories/{id} -> 200 OK with updated body")
    void update_returnsOk() throws Exception {
        when(behaviorCategoryService.update(eq(1L), any(BehaviorCategoryDTO.class)))
                .thenReturn(updatedResponse);

        mockMvc.perform(
                        put("/api/behavior-categories/{id}", 1L)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(updateRequest))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.severity").value("Moderate"))
                .andExpect(jsonPath("$.tier").value("Tier 2"))
                .andExpect(jsonPath("$.description").value("Escalated disruption"));
    }

    @Test
    @DisplayName("DELETE /api/behavior-categories/{id} -> 204 No Content")
    void delete_returnsNoContent() throws Exception {
        doNothing().when(behaviorCategoryService).delete(1L);

        mockMvc.perform(delete("/api/behavior-categories/{id}", 1L))
                .andExpect(status().isNoContent());

        Mockito.verify(behaviorCategoryService).delete(1L);
    }

    @Test
    @DisplayName("POST invalid payload -> 400 Bad Request")
    void create_validationError_returnsBadRequest() throws Exception {
        // assuming you use @Valid in controller + bean validation on DTO fields
        BehaviorCategoryDTO bad = new BehaviorCategoryDTO(
                null,
                "",           // name invalid
                "",           // severity invalid (if annotated)
                "",           // tier invalid (if annotated)
                ""            // description invalid (if annotated)
        );

        mockMvc.perform(
                        post("/api/behavior-categories")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(bad))
                )
                .andExpect(status().isBadRequest());
    }
}
