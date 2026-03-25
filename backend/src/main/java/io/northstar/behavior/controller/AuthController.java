package io.northstar.behavior.controller;

import io.northstar.behavior.dto.ChangePasswordRequest;
import io.northstar.behavior.dto.ForgotPasswordRequest;
import io.northstar.behavior.dto.ResetPasswordRequest;
import io.northstar.behavior.repository.AdminRepository;
import io.northstar.behavior.repository.TeacherRepository;
import io.northstar.behavior.service.PasswordResetService;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AdminRepository adminRepo;
    private final TeacherRepository teacherRepo;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetService passwordResetService;

    public AuthController(AdminRepository adminRepo, TeacherRepository teacherRepo,
                          PasswordEncoder passwordEncoder, PasswordResetService passwordResetService) {
        this.adminRepo = adminRepo;
        this.teacherRepo = teacherRepo;
        this.passwordEncoder = passwordEncoder;
        this.passwordResetService = passwordResetService;
    }

    private static void validatePassword(String pw) {
        if (pw == null || pw.length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters.");
        }
        if (!pw.matches(".*[0-9].*")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must contain at least 1 number.");
        }
        if (!pw.matches(".*[!@#$%^&*()\\-_=+\\[\\]{};':\"\\\\|,.<>/?].*")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must contain at least 1 special character.");
        }
    }

    @GetMapping("/me")
    @Transactional
    public ResponseEntity<Map<String, Object>> me() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        var adminOpt = adminRepo.findByUserName(username);
        if (adminOpt.isPresent()) {
            var a = adminOpt.get();
            var d = a.getDistrict();
            Map<String, Object> body = new HashMap<>();
            body.put("username", a.getUserName());
            body.put("name", a.getFirstName() + " " + a.getLastName());
            body.put("role", "Admin");
            body.put("districtId", d != null ? d.getDistrictId() : null);
            body.put("schoolId", a.getSchool() != null ? a.getSchool().getSchoolId() : null);
            body.put("mustChangePassword", a.isMustChangePassword());
            body.put("hasGradebook", d != null && d.isHasGradebook());
            body.put("hasAcademicTrend", d != null && d.isHasAcademicTrend());
            return ResponseEntity.ok(body);
        }

        var teacherOpt = teacherRepo.findByUserName(username);
        if (teacherOpt.isPresent()) {
            var t = teacherOpt.get();
            var d = t.getDistrict();
            Map<String, Object> body = new HashMap<>();
            body.put("username", t.getUserName());
            body.put("name", t.getFirstName() + " " + t.getLastName());
            body.put("role", "Teacher");
            body.put("districtId", d != null ? d.getDistrictId() : null);
            body.put("schoolId", t.getSchool() != null ? t.getSchool().getSchoolId() : null);
            body.put("mustChangePassword", t.isMustChangePassword());
            body.put("hasGradebook", d != null && d.isHasGradebook());
            body.put("hasAcademicTrend", d != null && d.isHasAcademicTrend());
            return ResponseEntity.ok(body);
        }

        return ResponseEntity.notFound().build();
    }

    @PostMapping("/change-password")
    @Transactional
    public ResponseEntity<Map<String, Object>> changePassword(@RequestBody ChangePasswordRequest req) {
        validatePassword(req == null ? null : req.newPassword());

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        String encoded = passwordEncoder.encode(req.newPassword());

        var adminOpt = adminRepo.findByUserName(username);
        if (adminOpt.isPresent()) {
            var a = adminOpt.get();
            a.setPasswordHash(encoded);
            a.setMustChangePassword(false);
            adminRepo.save(a);
            return ResponseEntity.ok(Map.of("ok", true));
        }

        var teacherOpt = teacherRepo.findByUserName(username);
        if (teacherOpt.isPresent()) {
            var t = teacherOpt.get();
            t.setPasswordHash(encoded);
            t.setMustChangePassword(false);
            teacherRepo.save(t);
            return ResponseEntity.ok(Map.of("ok", true));
        }

        return ResponseEntity.notFound().build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@RequestBody ForgotPasswordRequest req) {
        if (req != null && req.email() != null) {
            try {
                passwordResetService.initiateForgotPassword(req.email().trim());
            } catch (Exception ignored) {
                // Never expose internal errors — always return 200
            }
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(@RequestBody ResetPasswordRequest req) {
        if (req == null || req.token() == null || req.newPassword() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing token or password.");
        }
        validatePassword(req.newPassword());
        boolean ok = passwordResetService.resetPassword(req.token(), req.newPassword());
        if (!ok) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reset link is invalid or has expired.");
        }
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
