package io.northstar.behavior.controller;

import io.northstar.behavior.repository.AdminRepository;
import io.northstar.behavior.repository.TeacherRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AdminRepository adminRepo;
    private final TeacherRepository teacherRepo;

    public AuthController(AdminRepository adminRepo, TeacherRepository teacherRepo) {
        this.adminRepo = adminRepo;
        this.teacherRepo = teacherRepo;
    }

    @GetMapping("/me")
    @Transactional
    public ResponseEntity<Map<String, Object>> me() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        var adminOpt = adminRepo.findByUserName(username);
        if (adminOpt.isPresent()) {
            var a = adminOpt.get();
            Map<String, Object> body = new HashMap<>();
            body.put("username", a.getUserName());
            body.put("name", a.getFirstName() + " " + a.getLastName());
            body.put("role", "Admin");
            body.put("districtId", a.getDistrict() != null ? a.getDistrict().getDistrictId() : null);
            body.put("schoolId", a.getSchool() != null ? a.getSchool().getSchoolId() : null);
            return ResponseEntity.ok(body);
        }

        var teacherOpt = teacherRepo.findByUserName(username);
        if (teacherOpt.isPresent()) {
            var t = teacherOpt.get();
            Map<String, Object> body = new HashMap<>();
            body.put("username", t.getUserName());
            body.put("name", t.getFirstName() + " " + t.getLastName());
            body.put("role", "Teacher");
            body.put("districtId", t.getDistrict() != null ? t.getDistrict().getDistrictId() : null);
            body.put("schoolId", t.getSchool() != null ? t.getSchool().getSchoolId() : null);
            return ResponseEntity.ok(body);
        }

        return ResponseEntity.notFound().build();
    }
}
