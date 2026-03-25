package io.northstar.behavior.controller;

import io.northstar.behavior.dto.DistrictDTO;
import io.northstar.behavior.dto.DistrictFeaturesRequest;
import io.northstar.behavior.service.DistrictService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/districts")
public class DistrictController {

    private final DistrictService service;

    public DistrictController(DistrictService service){
        this.service = service;
    }

    // CREATE
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DistrictDTO create(@RequestBody DistrictDTO dto){
        return service.create(dto);
    }

    // READ ALL
    @GetMapping
    public List<DistrictDTO> list(){
        return service.findAll();
    }

    // READ ONE
    @GetMapping("/{id}")
    public DistrictDTO findById(@PathVariable Long id){
        return service.findDistrict(id);
    }

    // UPDATE
    @PutMapping("/{id}")
    public DistrictDTO update(@PathVariable Long id, @RequestBody DistrictDTO dto){
        return service.update(id, dto);
    }

    // DELETE
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    // PATCH features flags
    @PatchMapping("/{id}/features")
    public DistrictDTO updateFeatures(@PathVariable Long id, @RequestBody DistrictFeaturesRequest req) {
        return service.updateFeatures(id, req);
    }
}