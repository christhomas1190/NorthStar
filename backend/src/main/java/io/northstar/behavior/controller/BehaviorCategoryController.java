package io.northstar.behavior.controller;

import io.northstar.behavior.dto.BehaviorCategoryDTO;
import io.northstar.behavior.model.BehaviorCategory;
import io.northstar.behavior.service.BehaviorCategoryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/behavior-categories")
@CrossOrigin(origins = "*")
public class BehaviorCategoryController {

    private final BehaviorCategoryService service;

    public BehaviorCategoryController(BehaviorCategoryService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<BehaviorCategory> create(@RequestBody BehaviorCategoryDTO dto) {
        BehaviorCategory created = service.create(
                dto.name(),
                dto.severity(),
                dto.tier(),
                dto.description()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<BehaviorCategory>> list() {
        return ResponseEntity.ok(service.list());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BehaviorCategory> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BehaviorCategory> update(
            @PathVariable Long id,
            @RequestBody BehaviorCategoryDTO dto
    ) {
        BehaviorCategory updated = service.update(
                id,
                dto.name(),
                dto.severity(),
                dto.tier(),
                dto.description()
        );
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
