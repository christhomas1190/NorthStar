package io.northstar.behavior.controller;

import io.northstar.behavior.dto.BehaviorCategoryDTO;
import io.northstar.behavior.service.BehaviorCategoryService;
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

    // POST /api/behaviors -> 201 + Location + JSON body
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<BehaviorCategoryDTO> create(@RequestBody BehaviorCategoryDTO dto) {
        BehaviorCategoryDTO saved = service.create(dto);
        return ResponseEntity
                .created(URI.create("/api/behaviors/" + saved.id()))
                .body(saved);
    }

    // GET /api/behaviors -> 200 + JSON list
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public List<BehaviorCategoryDTO> findAll() {
        return service.findAll();
    }

    // GET /api/behaviors/{id} -> 200 + JSON item
    @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<BehaviorCategoryDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    // PUT /api/behaviors/{id} -> 200 + JSON item
    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public BehaviorCategoryDTO update(@PathVariable Long id, @RequestBody BehaviorCategoryDTO dto) {
        return service.update(id, dto);
    }

    // DELETE /api/behaviors/{id} -> 204
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }


}
