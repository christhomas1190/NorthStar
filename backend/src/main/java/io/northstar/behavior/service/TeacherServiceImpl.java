package io.northstar.behavior.service;

import io.northstar.behavior.dto.AdminDTO;
import io.northstar.behavior.dto.CreateTeacherRequest;
import io.northstar.behavior.dto.TeacherCautionStatsDTO;
import io.northstar.behavior.dto.TeacherDTO;
import io.northstar.behavior.model.Admin;
import io.northstar.behavior.model.School;
import io.northstar.behavior.model.Teacher;
import io.northstar.behavior.model.GradeCategory;
import io.northstar.behavior.repository.AdminRepository;
import io.northstar.behavior.repository.DistrictRepository;
import io.northstar.behavior.repository.GradeCategoryRepository;
import io.northstar.behavior.repository.IncidentRepository;
import io.northstar.behavior.repository.SchoolRepository;
import io.northstar.behavior.repository.TeacherRepository;

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
    private final IncidentRepository incidentRepository;
    private final GradeCategoryRepository gradeCategoryRepo;

    @Value("${app.default-teacher-password:Teach!2025#}")
    private String defaultTeacherPassword;

    @Value("${app.default-admin-password:Admin!2025#}")
    private String defaultAdminPassword;

    public TeacherServiceImpl(TeacherRepository repo,
                              DistrictRepository districtRepository,
                              SchoolRepository schoolRepository,
                              AdminRepository adminRepository,
                              IncidentRepository incidentRepository,
                              GradeCategoryRepository gradeCategoryRepo) {
        this.repo = repo;
        this.districtRepository = districtRepository;
        this.schoolRepository = schoolRepository;
        this.adminRepository = adminRepository;
        this.incidentRepository = incidentRepository;
        this.gradeCategoryRepo = gradeCategoryRepo;
    }

    private void seedDefaultCategories(Teacher teacher) {
        String[][] defaults = {
            {"Tests",     "40"},
            {"Classwork", "25"},
            {"Quizzes",   "20"},
            {"Homework",  "15"},
        };
        for (String[] row : defaults) {
            if (!gradeCategoryRepo.existsByTeacher_IdAndName(teacher.getId(), row[0])) {
                GradeCategory cat = new GradeCategory();
                cat.setTeacher(teacher);
                cat.setDistrict(teacher.getDistrict());
                cat.setName(row[0]);
                cat.setWeightPercent(Integer.parseInt(row[1]));
                gradeCategoryRepo.save(cat);
            }
        }
    }

    private TeacherDTO toDto(Teacher t){
        Long did = (t.getDistrict() != null) ? t.getDistrict().getDistrictId() : null;
        Long sid = (t.getSchool()   != null) ? t.getSchool().getSchoolId()           : null; // <-- add
        return new TeacherDTO(
                t.getId(),
                t.getFirstName(),
                t.getLastName(),
                t.getEmail(),
                t.getUserName(),
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
        if (!repo.existsByUserName(cand)) return cand;

        if (f.length() >= 2) {
            String c2 = f.substring(0,2) + l;
            if (!repo.existsByUserName(c2)) return c2;
            cand = c2;
        }
        int n = 1;
        while (repo.existsByUserName(cand + n)) n++;
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
        String userName = auth.getName();

        // 2) load admin and get tenant scope
        Admin admin = (Admin) adminRepository.findByUserName(userName)
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
        t.setUserName(generateUsername(t.getFirstName(), t.getLastName()));
        t.setPasswordHash(bcrypt(defaultTeacherPassword));
        t.setMustChangePassword(true);
        t.setDistrict(district);
        t.setSchool(school);

        Teacher saved = repo.save(t);
        seedDefaultCategories(saved);
        return toDto(saved);
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

        Admin admin = adminRepository.findAll()
                .stream()
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "no admin exists in system"
                ));

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
        t.setUserName(generateUsername(t.getFirstName(), t.getLastName()));
        t.setPasswordHash(bcrypt(defaultTeacherPassword));
        t.setMustChangePassword(true);
        t.setDistrict(district);
        t.setSchool(school);

        Teacher saved = repo.save(t);
        seedDefaultCategories(saved);
        return toDto(saved);
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

    @Override
    @Transactional
    public AdminDTO promoteToAdmin(Long teacherId) {
        Teacher t = repo.findById(teacherId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "teacher not found"));

        // Get logged-in admin's scope
        var auth = SecurityContextHolder.getContext().getAuthentication();
        Admin requestingAdmin = adminRepository.findByUserName(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "admin not found"));

        var district = requestingAdmin.getDistrict();
        var school = requestingAdmin.getSchool();

        // Generate unique admin username (check admin table)
        String base = normalize(t.getFirstName()).substring(0, 1) + normalize(t.getLastName());
        String username = base;
        int n = 1;
        while (adminRepository.existsByUserNameAndSchool_SchoolId(username, school.getSchoolId())) {
            username = base + n++;
        }

        Admin a = new Admin();
        a.setFirstName(t.getFirstName());
        a.setLastName(t.getLastName());
        a.setEmail(t.getEmail());
        a.setUserName(username);
        a.setPasswordHash(bcrypt(defaultAdminPassword));
        a.setMustChangePassword(true);
        a.setPermissionTag("ADMIN");
        a.setDistrict(district);
        a.setSchool(school);

        Admin saved = adminRepository.save(a);
        repo.deleteById(teacherId);

        return new AdminDTO(
                saved.getId(),
                saved.getFirstName(),
                saved.getLastName(),
                saved.getEmail(),
                saved.getUserName(),
                saved.getPermissionTag(),
                district.getDistrictId(),
                school.getSchoolId()
        );
    }

    @Override
    @Transactional
    public List<TeacherCautionStatsDTO> findAllStats() {
        String userName = SecurityContextHolder.getContext().getAuthentication().getName();
        Admin admin = adminRepository.findByUserName(userName)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "admin not found"));
        Long districtId = admin.getDistrict().getDistrictId();
        List<Teacher> all = repo.findByDistrict_DistrictId(districtId);
        List<TeacherCautionStatsDTO> out = new ArrayList<>();
        for (Teacher t : all) out.add(cautionStats(t.getId()));
        return out;
    }

    @Override
    public TeacherCautionStatsDTO cautionStats(Long teacherId) {
        Teacher t = repo.findById(teacherId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "teacher not found"));

        String reportedBy = t.getUserName();
        long total = incidentRepository.countByReportedBy(reportedBy);

        // Most common category
        List<Object[]> cats = incidentRepository.topCategoriesForTeacher(reportedBy);
        String topCategory = cats.isEmpty() ? null : (String) cats.get(0)[0];
        long topCategoryCount = cats.isEmpty() ? 0L : ((Number) cats.get(0)[1]).longValue();

        // Most cautioned student
        List<Object[]> students = incidentRepository.topStudentsForTeacher(reportedBy);
        Long topStudentId = null;
        String topStudentName = null;
        long topStudentCount = 0L;
        if (!students.isEmpty()) {
            Object[] row = students.get(0);
            topStudentId = ((Number) row[0]).longValue();
            topStudentName = row[1] + " " + row[2];
            topStudentCount = ((Number) row[3]).longValue();
        }

        return new TeacherCautionStatsDTO(
                t.getId(),
                t.getFirstName() + " " + t.getLastName(),
                t.getUserName(),
                total,
                topCategory,
                topCategoryCount,
                topStudentId,
                topStudentName,
                topStudentCount
        );
    }
}
