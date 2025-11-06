package io.northstar.behavior.service;

import io.northstar.behavior.dto.TeacherDTO;
import io.northstar.behavior.model.School;
import io.northstar.behavior.model.Teacher;
import io.northstar.behavior.repository.DistrictRepository;
import io.northstar.behavior.repository.SchoolRepository;   // <-- add
import io.northstar.behavior.repository.TeacherRepository;
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
    private final DistrictRepository districtRepository;
    private final SchoolRepository schoolRepository;       // <-- add

    @Value("${app.default-teacher-password:Teach!2025#}")
    private String defaultTeacherPassword;

    public TeacherServiceImpl(TeacherRepository repo,
                              DistrictRepository districtRepository,
                              SchoolRepository schoolRepository) {   // <-- add
        this.repo = repo;
        this.districtRepository = districtRepository;
        this.schoolRepository = schoolRepository;                     // <-- add
    }

    private TeacherDTO toDto(Teacher t){
        Long did = (t.getDistrict() != null) ? t.getDistrict().getDistrictId() : null;
        Long sid = (t.getSchool()   != null) ? t.getSchool().getSchoolId()           : null; // <-- add
        return new TeacherDTO(
                t.getId(),
                t.getFirstName(),
                t.getLastName(),
                t.getEmail(),
                t.getUsername(),
                did,
                sid                                               // <-- add
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
        if (dto.districtId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "districtId is required");
        }
        if (dto.schoolId() == null) {                                     // <-- require school
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "schoolId is required");
        }

        String email = dto.email().trim().toLowerCase();
        if (repo.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "email already exists");
        }

        // load refs
        var district = districtRepository.getReferenceById(dto.districtId());
        School school = schoolRepository.findById(dto.schoolId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "school not found"));

        // (optional) district-school consistency check
        if (school.getDistrict() == null || !district.getDistrictId().equals(school.getDistrict().getDistrictId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "school not in given district");
        }

        Teacher t = new Teacher();
        t.setFirstName(dto.firstName().trim());
        t.setLastName(dto.lastName().trim());
        t.setEmail(email);
        t.setUsername(generateUsername(t.getFirstName(), t.getLastName()));
        t.setPasswordHash(bcrypt(defaultTeacherPassword));
        t.setDistrict(district);
        t.setSchool(school);                                              // <-- set school

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
        if (dto.lastName()  != null && !dto.lastName().isBlank())  t.setLastName(dto.lastName().trim());
        if (dto.email()     != null && !dto.email().isBlank()) {
            String newEmail = dto.email().trim().toLowerCase();
            if (!newEmail.equals(t.getEmail()) && repo.existsByEmail(newEmail)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "email already exists");
            }
            t.setEmail(newEmail);
        }
        if (dto.districtId() != null) {
            t.setDistrict(districtRepository.getReferenceById(dto.districtId()));
        }
        if (dto.schoolId() != null) {                                     // <-- allow school change
            School school = schoolRepository.findById(dto.schoolId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "school not found"));
            t.setSchool(school);
        }

        return toDto(t);
    }

    @Override
    public void delete(Long id) {
        if (!repo.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "teacher not found");
        repo.deleteById(id);
    }
}
