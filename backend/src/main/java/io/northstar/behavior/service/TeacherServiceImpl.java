package io.northstar.behavior.service;


import io.northstar.behavior.dto.TeacherDTO;
import io.northstar.behavior.model.Teacher;
import io.northstar.behavior.repository.TeacherRepository;
import io.northstar.behavior.service.TeacherService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;

@Service
public class TeacherServiceImpl implements TeacherService {

    private final TeacherRepository repo;

    @Value("${app.default-teacher-password:SetMeNow!2025}")
    private String defaultTeacherPassword;

    public TeacherServiceImpl(TeacherRepository repo) {
        this.repo = repo;
    }

    private TeacherDTO toDto(Teacher t){
        return new TeacherDTO(
                t.getId(),
                t.getFirstName(),
                t.getLastName(),
                t.getEmail(),
                t.getUsername()
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
        if (!repo.existsByUsername(candidate)) return candidate;

        // Rule 2: first two letters + last name (e.g., jadoe)
        if (f.length() >= 2) {
            String candidate2 = f.substring(0, 2) + l;
            if (!repo.existsByUsername(candidate2)) return candidate2;
            candidate = candidate2;
        }

        // Rule 3: append numeric suffix (jadoe1, jadoe2, ...)
        int n = 1;
        while (repo.existsByUsername(candidate + n)) {
            n++;
        }
        return candidate + n;
    }

    private String bcrypt(String raw){
        return org.springframework.security.crypto.bcrypt.BCrypt
                .hashpw(raw, org.springframework.security.crypto.bcrypt.BCrypt.gensalt());
    }

    @Override
    @Transactional
    public TeacherDTO create(TeacherDTO dto) {
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
        if (repo.existsByEmail(dto.email().trim().toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "email already exists");
        }

        Teacher t = new Teacher();
        t.setFirstName(dto.firstName().trim());
        t.setLastName(dto.lastName().trim());
        t.setEmail(dto.email().trim().toLowerCase());

        // Generate username and set default password hash
        String uname = generateUsername(t.getFirstName(), t.getLastName());
        t.setUsername(uname);
        t.setPasswordHash(bcrypt(defaultTeacherPassword)); // NEVER return this

        Teacher saved = repo.save(t);
        return toDto(saved);
    }

    @Override
    public List<TeacherDTO> findAll() {
        List<Teacher> all = repo.findAll();
        List<TeacherDTO> out = new ArrayList<>();
        for (int i = 0; i < all.size(); i++) {
            out.add(toDto(all.get(i)));
        }
        return out;
    }

    @Override
    public TeacherDTO findById(Long id) {
        Teacher t = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "teacher not found"));
        return toDto(t);
    }

    @Override
    @Transactional
    public TeacherDTO update(Long id, TeacherDTO dto) {
        Teacher t = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "teacher not found"));

        // Allow first/last/email updates; username is system-managed (don’t change here)
        if (dto.firstName() != null && !dto.firstName().isBlank()) {
            t.setFirstName(dto.firstName().trim());
        }
        if (dto.lastName() != null && !dto.lastName().isBlank()) {
            t.setLastName(dto.lastName().trim());
        }
        if (dto.email() != null && !dto.email().isBlank()) {
            String newEmail = dto.email().trim().toLowerCase();
            if (!newEmail.equals(t.getEmail()) && repo.existsByEmail(newEmail)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "email already exists");
            }
            t.setEmail(newEmail);
        }

        // If you want username to auto-update when names change, uncomment this block.
        // Be aware this can be surprising to users; many systems keep username immutable.
        /*
        String newUsername = generateUsername(t.getFirstName(), t.getLastName());
        if (!newUsername.equals(t.getUsername())) {
            t.setUsername(newUsername);
        }
        */

        return toDto(t);
    }

    @Override
    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "teacher not found");
        }
        repo.deleteById(id);
    }
}
