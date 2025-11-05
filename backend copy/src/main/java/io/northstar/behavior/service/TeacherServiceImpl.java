// src/main/java/io/northstar/behavior/service/TeacherServiceImpl.java
package io.northstar.behavior.service;

import io.northstar.behavior.dto.TeacherDTO;
import io.northstar.behavior.model.Teacher;
import io.northstar.behavior.repository.DistrictRepository;
import io.northstar.behavior.repository.TeacherRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;  // <-- keep this
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;

@Service
public class TeacherServiceImpl implements TeacherService {

    private final TeacherRepository repo;
    private final DistrictRepository districtRepository;

    @Value("${app.default-teacher-password:Teach!2025#}")
    private String defaultTeacherPassword;

    public TeacherServiceImpl(TeacherRepository repo, DistrictRepository districtRepository) {
        this.repo = repo;
        this.districtRepository = districtRepository;
    }

    private TeacherDTO toDto(Teacher t){
        Long did = (t.getDistrict() != null) ? t.getDistrict().getDistrictId() : null;
        return new TeacherDTO(
                t.getId(),
                t.getFirstName(),
                t.getLastName(),
                t.getEmail(),
                t.getUsername(),
                did
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
        String cand = f.substring(0,1) + l;
        if (!repo.existsByUsername(cand)) return cand;

        if (f.length() >= 2) {
            String c2 = f.substring(0,2) + l;
            if (!repo.existsByUsername(c2)) return c2;
            cand = c2;
        }
        int n = 1;
        while (repo.existsByUsername(cand + n)) n++;
        return cand + n;
    }

    private String bcrypt(String raw){
        return org.springframework.security.crypto.bcrypt.BCrypt
                .hashpw(raw, org.springframework.security.crypto.bcrypt.BCrypt.gensalt());
    }

    @Override
    @Transactional
    public TeacherDTO create(TeacherDTO dto) {
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

        Teacher t = new Teacher();
        t.setFirstName(dto.firstName().trim());
        t.setLastName(dto.lastName().trim());
        t.setEmail(email);
        t.setUsername(generateUsername(t.getFirstName(), t.getLastName()));
        t.setPasswordHash(bcrypt(defaultTeacherPassword));

        // >>> add this: set district from dto.districtId() if provided
        if (dto.districtId() != null) {
            t.setDistrict(districtRepository.getReferenceById(dto.districtId()));
        }

        return toDto(repo.save(t));
    }

    @Override
    public List<TeacherDTO> findAll() {
        List<Teacher> list = repo.findAll();
        List<TeacherDTO> out = new ArrayList<>();
        for (int i = 0; i < list.size(); i++) out.add(toDto(list.get(i)));
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

        if (dto.firstName() != null && !dto.firstName().isBlank()) t.setFirstName(dto.firstName().trim());
        if (dto.lastName() != null && !dto.lastName().isBlank())   t.setLastName(dto.lastName().trim());
        if (dto.email() != null && !dto.email().isBlank()) {
            String newEmail = dto.email().trim().toLowerCase();
            if (!newEmail.equals(t.getEmail()) && repo.existsByEmail(newEmail)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "email already exists");
            }
            t.setEmail(newEmail);
        }
        // optional: allow district change when dto provides it
        if (dto.districtId() != null) {
            t.setDistrict(districtRepository.getReferenceById(dto.districtId()));
        }

        return toDto(t);
    }

    @Override
    public void delete(Long id) {
        if (!repo.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "teacher not found");
        repo.deleteById(id);
    }
}
