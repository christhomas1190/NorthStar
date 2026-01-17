package io.northstar.behavior.controller;

import io.northstar.behavior.dto.CreateSchoolRequest;
import io.northstar.behavior.dto.SchoolDTO;
import io.northstar.behavior.service.SchoolService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/districts/{districtId}/schools")
public class SchoolController {

    private final SchoolService schools;

    public SchoolController(SchoolService schools) {
        this.schools = schools;
    }

    @PostMapping
    public SchoolDTO create(@PathVariable Long districtId,
                            @RequestBody CreateSchoolRequest req) {
        return schools.create(districtId, req);
    }

    @GetMapping
    public List<SchoolDTO> list(@PathVariable Long districtId) {
        return schools.listByDistrict(districtId);
    }



    @GetMapping("/{schoolId}")
    public SchoolDTO findOne(@PathVariable Long schoolId) {
        return schools.findById(schoolId);
    }

    @DeleteMapping("/{schoolId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long schoolId) {
        schools.delete(schoolId);
    }
}
