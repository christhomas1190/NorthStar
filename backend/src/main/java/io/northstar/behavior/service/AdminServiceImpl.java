package io.northstar.behavior.service;


import io.northstar.behavior.dto.AdminDTO;
import io.northstar.behavior.model.Admin;
import io.northstar.behavior.repository.AdminRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;

@Service
@Transactional
public class AdminServiceImpl {

    private final AdminRepository repo;

    @Value("${app.default-teacher-password:SetMeNow!2025}")
    private String defaultTeacherPassword;

    public AdminServiceImpl (AdminRepository repo){
        this.repo=repo;
    }

    private AdminDTO toDto(Admin a){
        return new AdminDTO(
                a.getId(),
                a.getFirstName(),
                a.getLastName(),
                a.getEmail(),
                a.getUserName()
        );
    }
    private String normalize(String s){
        if (s == null) return "";
        String base = Normalizer.normalize(s.toLowerCase(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", ""); // strip diacritics
        return base.replaceAll("[^a-z]", ""); // letters only
    }
    private String generateUsername(String firstName, String lastName){
        String f = normalize(firstName);
        String l = normalize(lastName);
        if (f.isEmpty() || l.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid names");
        }

        // Rule 1: first initial + last name (e.g., jdoe)
        String candidate = f.substring(0, 1) + l;
        if (!repo.getUserName(candidate)) return candidate;

        // Rule 2: first two letters + last name (e.g., jadoe)
        if (f.length() >= 2) {
            String candidate2 = f.substring(0, 2) + l;
            if (!repo.getUserName(candidate2)) return candidate2;
            candidate = candidate2;
        }

        // Rule 3: append numeric suffix (jadoe1, jadoe2, ...)
        int n = 1;
        while (repo.getUserName(candidate + n)) {
            n++;
        }
        return candidate + n;
    }
    private String bcrypt(String raw){
        return org.springframework.security.crypto.bcrypt.BCrypt
                .hashpw(raw, org.springframework.security.crypto.bcrypt.BCrypt.gensalt());
    }

    public AdminDTO create(AdminDTO dto) {
        if (dto == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "body is required");
        }
        if (dto.firstName() == null || dto.firstName().isBlank()
                || dto.lastName() == null || dto.lastName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "first/last name required");
        }
        if (dto.email() == null || dto.email().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "email is required");
        }
        if (repo.getEmail(dto.email().trim().toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "email already exists");
        }

        Admin a = new Admin();
        a.setFirstName(dto.firstName().trim());
        a.setLastName(dto.lastName().trim());
        a.setEmail(dto.email().trim().toLowerCase());

        // Generate username and set default password hash
        String uname = generateUsername(a.getFirstName(), a.getLastName());
        a.setUserName(uname);
        a.setPasswordHash(bcrypt(defaultTeacherPassword)); // NEVER return this

        Admin saved = repo.save(a);
        return toDto(saved);
    }

    public AdminDTO update(Long id, AdminDTO dto) {
        Admin a = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin not found"));

        // Allow first/last/email updates; username is system-managed (don’t change here)
        if (dto.firstName() != null && !dto.firstName().isBlank()) {
            a.setFirstName(dto.firstName().trim());
        }
        if (dto.lastName() != null && !dto.lastName().isBlank()) {
            a.setLastName(dto.lastName().trim());
        }
        if (dto.email() != null && !dto.email().isBlank()) {
            String newEmail = dto.email().trim().toLowerCase();
            if (!newEmail.equals(a.getEmail()) && repo.getEmail(newEmail)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "email already exists");
            }
            a.setEmail(newEmail);
        }

        // If you want username to auto-update when names change, uncomment this block.
        // Be aware this can be surprising to users; many systems keep username immutable.
        /*
        String newUsername = generateUsername(t.getFirstName(), t.getLastName());
        if (!newUsername.equals(t.getUsername())) {
            t.setUsername(newUsername);
        }
        */

        return toDto(a);
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin not found");
        }
        repo.deleteById(id);
    }

}
