package io.northstar.behavior.controller;

import io.northstar.behavior.dto.AdminDTO;
import io.northstar.behavior.dto.CreateTeacherRequest;
import io.northstar.behavior.dto.IncidentDTO;
import io.northstar.behavior.dto.TeacherCautionStatsDTO;
import io.northstar.behavior.dto.TeacherDTO;
import io.northstar.behavior.service.IncidentService;
import io.northstar.behavior.service.TeacherService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teachers")
public class TeacherController {

    private final TeacherService service;
    private final IncidentService incidentService;

    public TeacherController(TeacherService service, IncidentService incidentService) {
        this.service = service;
        this.incidentService = incidentService;
    }

    // CREATE
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TeacherDTO create(@RequestBody @Valid CreateTeacherRequest req) {
        return service.createForCurrentAdmin(req);
    }

    // READ ALL
    @GetMapping
    public List<TeacherDTO> all() {
        return service.findAll();
    }

    // ALL STATS
    @GetMapping("/stats")
    public List<TeacherCautionStatsDTO> allStats() {
        return service.findAllStats();
    }

    // READ ONE
    @GetMapping("/{id}")
    public TeacherDTO one(@PathVariable Long id) {
        return service.findById(id);
    }

    // STATS FOR ONE
    @GetMapping("/{id}/stats")
    public TeacherCautionStatsDTO stats(@PathVariable Long id) {
        return service.cautionStats(id);
    }

    // INCIDENTS FOR ONE
    @GetMapping("/{id}/incidents")
    public List<IncidentDTO> incidents(@PathVariable Long id) {
        return incidentService.listByReportedBy(id);
    }

    // UPDATE
    @PutMapping("/{id}")
    public TeacherDTO update(@PathVariable Long id, @RequestBody TeacherDTO dto) {
        return service.update(id, dto);
    }

    // DELETE
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    // PROMOTE to admin
    @PostMapping("/{id}/promote-to-admin")
    public AdminDTO promoteToAdmin(@PathVariable Long id) {
        return service.promoteToAdmin(id);
    }
}
