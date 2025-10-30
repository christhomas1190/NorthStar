// src/main/java/io/northstar/behavior/service/AdminServiceImpl.java
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
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class AdminServiceImpl implements AdminService {

    private final AdminRepository repo;

    // Prefer a distinct key for admins:
    @Value("${app.default-admin-password:Admin!2025#}")
    private String defaultAdminPassword;

    public AdminServiceImpl(AdminRepository repo) {
        this.repo = repo;
    }

    private AdminDTO toDto(Admin a){
        return new AdminDTO(
                a.getId(),
                a.getFirstName(),
                a.getLastName(),
                a.getEmail(),
                a.getUserName(),
                a.getPermissionTag()
        );
    }

    private String normalize(String s){
        if (s == null) return "";
        String base = Normalizer.normalize(s.toLowerCase(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return base.replaceAll("[^a-z]", "");
    }

    private String generateUsername(String firstName, String lastName){
        String f = normalize(firstName);
        String l = normalize(lastName);
        if (f.isEmpty() || l.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid names");
        }

        String candidate = f.substring(0, 1) + l;             // jdoe
        if (!repo.existsByUserName(candidate)) return candidate;

        if (f.length() >= 2) {
            String candidate2 = f.substring(0, 2) + l;        // jadoe
            if (!repo.existsByUserName(candidate2)) return candidate2;
            candidate = candidate2;
        }

        int n = 1;
        while (repo.existsByUserName(candidate + n)) n++;
        return candidate + n;                                  // jadoe1, jadoe2, ...
    }

    private String bcrypt(String raw){
        return org.springframework.security.crypto.bcrypt.BCrypt
                .hashpw(raw, org.springframework.security.crypto.bcrypt.BCrypt.gensalt());
    }

    @Override
    public AdminDTO create(AdminDTO dto) {
        if (dto == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "body is required");
        if (dto.firstName() == null || dto.firstName().isBlank()
                || dto.lastName() == null || dto.lastName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "first/last name required");
        }
        if (dto.email() == null || dto.email().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "email is required");
        }
        String email = dto.email().trim().toLowerCase();
        if (repo.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "email already exists");
        }

        Admin a = new Admin();
        a.setFirstName(dto.firstName().trim());
        a.setLastName(dto.lastName().trim());
        a.setEmail(email);

        String uname = generateUsername(a.getFirstName(), a.getLastName());
        a.setUserName(uname);
        a.setPasswordHash(bcrypt(defaultAdminPassword));
        a.setPermissionTag("SUPER_ADMIN"); // or "ADMIN" — set a sensible default here

        Admin saved = repo.save(a);
        return toDto(saved);
    }

    @Override
    public List<AdminDTO> findAll() {
        List<Admin> all = repo.findAll();
        List<AdminDTO> out = new ArrayList<>();
        for (int i = 0; i < all.size(); i++) {
            out.add(toDto(all.get(i)));
        }
        return out;
    }

    @Override
    public AdminDTO findById(Long id) {
        Admin a = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin not found"));
        return toDto(a);
    }

    @Override
    public AdminDTO update(Long id, AdminDTO dto) {
        Admin a = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin not found"));

        if (dto.firstName() != null && !dto.firstName().isBlank()) {
            a.setFirstName(dto.firstName().trim());
        }
        if (dto.lastName() != null && !dto.lastName().isBlank()) {
            a.setLastName(dto.lastName().trim());
        }
        if (dto.email() != null && !dto.email().isBlank()) {
            String newEmail = dto.email().trim().toLowerCase();
            if (!newEmail.equals(a.getEmail()) && repo.existsByEmail(newEmail)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "email already exists");
            }
            a.setEmail(newEmail);
        }

        return toDto(a);
    }

    @Override
    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin not found");
        }
        repo.deleteById(id);
    }
}
