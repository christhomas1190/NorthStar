package io.northstar.behavior.controller;

import io.northstar.behavior.dto.AdminDTO;
import io.northstar.behavior.dto.TeacherDTO;
import io.northstar.behavior.service.AdminService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService service;

    public AdminController(AdminService service){
        this.service=service;
    }

    // CREATE
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AdminDTO create(@RequestBody AdminDTO dto) {
        return service.create(dto);
    }

    //FindAll
    @GetMapping
    public List<AdminDTO> list(){
        return service.findAll();
    }

    //Read One
    @GetMapping("/{id}")
    public AdminDTO findById(@PathVariable Long id){
        return service.findById(id);
    }

    //Update
    @PutMapping("/{id}")
    public AdminDTO update(@PathVariable Long id, @RequestBody AdminDTO dto){
        return service.update(id, dto);
    }

    //Delete
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
