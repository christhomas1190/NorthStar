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
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;


@WebMvcTest(controllers = StudentController.class)
public class StudentControllerTests {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean StudentService students;

    // ---- helpers to build domain objects the controller returns ----
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
        // entity field is spelled occuredAt (one 'r'); keep consistent with your model
        inc.setOccurredAt(OffsetDateTime.parse("2025-09-01T08:00:00Z"));
        inc.setCreatedAt(OffsetDateTime.parse("2025-09-01T09:00:00Z"));
        return inc;
    }
    private Intervention intervention(long id, long studentId, String tier, String strategy) {
        Intervention iv = new Intervention();
        iv.setId(id);
        iv.setStudentId(studentId);
        iv.setTier(tier);
        iv.setStrategy(strategy);
        iv.setAssignedBy("Counselor B");
        iv.setReportedBy("Teacher C");
        iv.setStartDate(LocalDate.parse("2025-09-02"));
        iv.setEndDate(LocalDate.parse("2025-09-10"));
        iv.setCreatedAt(OffsetDateTime.parse("2025-09-02T12:00:00Z"));
        return iv;
    }

}
