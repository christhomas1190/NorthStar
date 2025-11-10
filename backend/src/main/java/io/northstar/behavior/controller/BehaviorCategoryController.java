// src/main/java/io/northstar/behavior/controller/BehaviorCategoryController.java
package io.northstar.behavior.controller;

import io.northstar.behavior.dto.BehaviorCategoryDTO;
import io.northstar.behavior.service.BehaviorCategoryService;
import io.northstar.behavior.tenant.TenantContext;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/behaviors")
public class BehaviorCategoryController {

    private final BehaviorCategoryService service;

    public BehaviorCategoryController(BehaviorCategoryService service) {
        this.service = service;
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<BehaviorCategoryDTO> create(
            @RequestHeader("X-District-Id") Long districtId,
            @RequestBody BehaviorCategoryDTO dto) {
        try {
            TenantContext.setDistrictId(districtId);
            BehaviorCategoryDTO saved = service.create(dto);
            return ResponseEntity.created(URI.create("/api/behaviors/" + saved.id())).body(saved);
        } finally {
            TenantContext.clear();
        }
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public List<BehaviorCategoryDTO> findAll(@RequestHeader("X-District-Id") Long districtId) {
        try {
            TenantContext.setDistrictId(districtId);
            return service.findAll();
        } finally {
            TenantContext.clear();
        }
    }

    @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<BehaviorCategoryDTO> findById(
            @RequestHeader("X-District-Id") Long districtId,
            @PathVariable Long id) {
        try {
            TenantContext.setDistrictId(districtId);
            return ResponseEntity.ok(service.findById(id));
        } finally {
            TenantContext.clear();
        }
    }

    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public BehaviorCategoryDTO update(
            @RequestHeader("X-District-Id") Long districtId,
            @PathVariable Long id,
            @RequestBody BehaviorCategoryDTO dto) {
        try {
            TenantContext.setDistrictId(districtId);
            return service.update(id, dto);
        } finally {
            TenantContext.clear();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @RequestHeader("X-District-Id") Long districtId,
            @PathVariable Long id) {
        try {
            TenantContext.setDistrictId(districtId);
            service.delete(id);
            return ResponseEntity.noContent().build();
        } finally {
            TenantContext.clear();
        }
    }
}
