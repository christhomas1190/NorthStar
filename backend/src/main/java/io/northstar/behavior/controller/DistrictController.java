package io.northstar.behavior.controller;


import io.northstar.behavior.dto.DistrictDTO;
import io.northstar.behavior.service.DistrictService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
public class DistrictController {

    private final DistrictService service;

    public DistrictController(DistrictService service){
        this.service=service;
    }

    // CREATE
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DistrictDTO create(@RequestBody DistrictDTO dto){
        return service.create(dto);
    }

    //FindAll
    @GetMapping
    public List<DistrictDTO> list(){
        return service.findAll();
    }

    //Read One
    @GetMapping("/{id}")
    public DistrictDTO findById(@PathVariable DistrictDTO dto){
        return service.findDistrict(dto);
    }

    //Update
    @PutMapping("/{id}")
    public DistrictDTO update(@PathVariable Long id, @RequestBody DistrictDTO dto){
        return service.update(id, dto);
    }
    //Delete
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
