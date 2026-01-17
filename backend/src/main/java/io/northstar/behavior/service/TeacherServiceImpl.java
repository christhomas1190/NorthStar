package io.northstar.behavior.service;

import io.northstar.behavior.dto.TeacherDTO;
import io.northstar.behavior.model.Admin;
import io.northstar.behavior.model.School;
import io.northstar.behavior.model.Teacher;
import io.northstar.behavior.repository.AdminRepository;
import io.northstar.behavior.repository.DistrictRepository;
import io.northstar.behavior.repository.SchoolRepository;
import io.northstar.behavior.repository.TeacherRepository;
import io.northstar.behavior.dto.CreateTeacherRequest;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;

@Service
public class TeacherServiceImpl implements TeacherService {

    private final TeacherRepository repo;
    private final DistrictRepository districtRepository;
    private final SchoolRepository schoolRepository;
    private final AdminRepository adminRepository;

    @Value("${app.default-teacher-password:Teach!2025#}")
    private String defaultTeacherPassword;

    public TeacherServiceImpl(TeacherRepository repo,
                              DistrictRepository districtRepository,
                              SchoolRepository schoolRepository,
                              AdminRepository adminRepository
                              ) {
        this.repo = repo;
        this.districtRepository = districtRepository;
        this.schoolRepository = schoolRepository;
        this.adminRepository=adminRepository;// <-- add
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
                sid
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

        // 1) who is logged in?
        var auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        // 2) load admin and get tenant scope
        Admin admin = (Admin) adminRepository.findByUserName(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "admin not found"));

        Long districtId = admin.getDistrict().getDistrictId();
        Long schoolId   = admin.getSchool().getSchoolId();

        String email = dto.email().trim().toLowerCase();

        // (optional but recommended) scope uniqueness per district if you support multiple districts
        if (repo.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "email already exists");
        }

        // 3) load refs using ADMIN district/school (NOT dto)
        var district = districtRepository.getReferenceById(districtId);
        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "school not found"));

        Teacher t = new Teacher();
        t.setFirstName(dto.firstName().trim());
        t.setLastName(dto.lastName().trim());
        t.setEmail(email);
        t.setUsername(generateUsername(t.getFirstName(), t.getLastName()));
        t.setPasswordHash(bcrypt(defaultTeacherPassword));
        t.setDistrict(district);
        t.setSchool(school);

        return toDto(repo.save(t));
    }
    @Override
    @Transactional
    public TeacherDTO createForCurrentAdmin(CreateTeacherRequest req) {
        if (req == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "body is required");
        }
        if (req.firstName() == null || req.firstName().isBlank()
                || req.lastName() == null || req.lastName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "first/last name required");
        }
        if (req.email() == null || req.email().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "email is required");
        }

        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null || auth.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "not authenticated");
        }
        String username = auth.getName();

        Admin admin = adminRepository.findByUserName(username.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "admin not found"));

        if (admin.getDistrict() == null || admin.getDistrict().getDistrictId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "admin has no district");
        }
        if (admin.getSchool() == null || admin.getSchool().getSchoolId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "admin has no school");
        }

        Long districtId = admin.getDistrict().getDistrictId();
        Long schoolId = admin.getSchool().getSchoolId();

        String email = req.email().trim().toLowerCase();
        if (repo.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "email already exists");
        }

        var district = districtRepository.getReferenceById(districtId);
        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "school not found"));

        Teacher t = new Teacher();
        t.setFirstName(req.firstName().trim());
        t.setLastName(req.lastName().trim());
        t.setEmail(email);
        t.setUsername(generateUsername(t.getFirstName(), t.getLastName()));
        t.setPasswordHash(bcrypt(defaultTeacherPassword));
        t.setDistrict(district);
        t.setSchool(school);

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
