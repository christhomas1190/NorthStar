package io.northstar.behavior.service;

import io.northstar.behavior.dto.CreateStudentRequest;
import io.northstar.behavior.dto.IncidentSummaryDTO;
import io.northstar.behavior.dto.InterventionSummaryDTO;
import io.northstar.behavior.dto.StudentDTO;
import io.northstar.behavior.model.District;
import io.northstar.behavior.model.Incident;
import io.northstar.behavior.model.Intervention;
import io.northstar.behavior.model.School;
import io.northstar.behavior.model.Student;
import io.northstar.behavior.repository.DistrictRepository;
import io.northstar.behavior.repository.SchoolRepository;
import io.northstar.behavior.repository.StudentRepository;
import io.northstar.behavior.tenant.TenantContext;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class StudentServiceImpl implements StudentService {

    private final StudentRepository repo;
    private final DistrictRepository districtRepo;
    private final SchoolRepository schools;

    public StudentServiceImpl(StudentRepository repo,
                              DistrictRepository districtRepo,
                              SchoolRepository schools) {
        this.repo = repo;
        this.districtRepo = districtRepo;
        this.schools = schools;
    }

    // ---------- helpers (keep private; not in interface) ----------

    private List<IncidentSummaryDTO> toIncidentSummaries(List<Incident> incs) {
        List<IncidentSummaryDTO> out = new ArrayList<>();
        if (incs != null) {
            for (int i = 0; i < incs.size(); i++) {
                Incident it = incs.get(i);
                Long did = (it.getDistrict() != null) ? it.getDistrict().getDistrictId() : null;
                out.add(new IncidentSummaryDTO(
                        it.getId(),
                        it.getCategory(),
                        it.getSeverity(),
                        it.getOccurredAt(),
                        did
                ));
            }
        }
        return out;
    }

    private List<InterventionSummaryDTO> toInterventionSummaries(List<Intervention> ivs) {
        List<InterventionSummaryDTO> out = new ArrayList<>();
        if (ivs != null) {
            for (int i = 0; i < ivs.size(); i++) {
                Intervention iv = ivs.get(i);
                Long did = (iv.getDistrict() != null) ? iv.getDistrict().getDistrictId() : null;
                out.add(new InterventionSummaryDTO(
                        iv.getId(),
                        iv.getTier(),
                        iv.getStrategy(),
                        iv.getStartDate(),
                        iv.getEndDate(),
                        did
                ));
            }
        }
        return out;
    }

    private StudentDTO toDto(Student s) {
        long id = (s.getId() == null ? 0L : s.getId());
        Long did = (s.getDistrict() != null) ? s.getDistrict().getDistrictId() : null;
        Long sid = (s.getSchool() != null) ? s.getSchool().getSchoolId() : null;

        return new StudentDTO(
                id,
                s.getFirstName(),
                s.getLastName(),
                s.getStudentId(),
                s.getGrade(),
                toIncidentSummaries(s.getIncidents()),
                toInterventionSummaries(s.getInterventions()),
                did,
                sid
        );
    }

    // ---------- create with schoolId (new path) ----------
    @Override
    public StudentDTO create(CreateStudentRequest req) {
        if (req == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "body is required");
        if (req.firstName() == null || req.firstName().isBlank()
                || req.lastName() == null || req.lastName().isBlank()
                || req.studentId() == null || req.studentId().isBlank()
                || req.grade() == null || req.grade().isBlank()
                || req.schoolId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "missing required fields");
        }

        Long districtId = TenantContext.getDistrictId();
        if (districtId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "district not found in context");

        if (repo.existsByStudentIdAndDistrict_DistrictId(req.studentId().trim(), districtId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "student already exists in district");
        }

        // Verify the school belongs to the current district
        School school = schools.findById(req.schoolId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "school not found"));
        if (school.getDistrict() == null || !districtId.equals(school.getDistrict().getDistrictId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "school not in current district");
        }

        Student s = new Student();
        s.setFirstName(req.firstName().trim());
        s.setLastName(req.lastName().trim());
        s.setStudentId(req.studentId().trim());
        s.setGrade(req.grade().trim());
        s.setDistrict(districtRepo.getReferenceById(districtId));
        s.setSchool(school);

        return toDto(repo.save(s));
    }

    // ---------- legacy create (DTO) ----------
    @Override
    public StudentDTO create(StudentDTO dto) {
        if (dto == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "body is required");

        // If schoolId is present in the DTO, delegate to the new path
        if (dto.schoolId() != null) {
            return create(new CreateStudentRequest(
                    dto.firstName(), dto.lastName(), dto.studentId(), dto.grade(), dto.schoolId()
            ));
        }

        Long districtId = TenantContext.getDistrictId();
        if (districtId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "district not found in context");

        if (repo.existsByStudentIdAndDistrict_DistrictId(dto.studentId().trim(), districtId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "student already exists in district");
        }

        Student s = new Student();
        s.setFirstName(dto.firstName().trim());
        s.setLastName(dto.lastName().trim());
        s.setStudentId(dto.studentId().trim());
        s.setGrade(dto.grade().trim());
        s.setDistrict(districtRepo.getReferenceById(districtId));
        // no school set in this legacy path

        return toDto(repo.save(s));
    }

    @Override
    public List<StudentDTO> findAll() {
        Long districtId = TenantContext.getDistrictId();
        if (districtId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "district not found in context");

        List<Student> list = repo.findByDistrict_DistrictId(districtId);
        List<StudentDTO> out = new ArrayList<>();
        for (int i = 0; i < list.size(); i++) out.add(toDto(list.get(i)));
        return out;
    }

    @Override
    public StudentDTO findById(Long id) {
        Long districtId = TenantContext.getDistrictId();
        Student s = repo.findByIdAndDistrict_DistrictId(id, districtId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "student not found"));
        return toDto(s);
    }

    @Override
    public StudentDTO update(Long id, StudentDTO dto) {
        Long districtId = TenantContext.getDistrictId();
        Student s = repo.findByIdAndDistrict_DistrictId(id, districtId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "student not found"));

        if (dto.firstName() != null && !dto.firstName().isBlank()) s.setFirstName(dto.firstName().trim());
        if (dto.lastName() != null && !dto.lastName().isBlank())   s.setLastName(dto.lastName().trim());
        if (dto.grade() != null && !dto.grade().isBlank())         s.setGrade(dto.grade().trim());

        return toDto(s); // managed entity; flushed on commit
    }

    @Override
    public void delete(Long id) {
        Long districtId = TenantContext.getDistrictId();
        Student s = repo.findByIdAndDistrict_DistrictId(id, districtId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "student not found"));
        repo.delete(s);
    }
    @Override
    public byte[] generateReportForStudent(Long studentId,
                                           Long districtId,
                                           LocalDate from,
                                           LocalDate to) {
        // TODO: replace this with a real PDF builder


        String text = """
            Student Behavior Report
            -----------------------
            Student ID: %d
            District ID: %d
            From: %s
            To: %s

            (Implement real PDF content here: incidents + interventions.)
            """.formatted(
                studentId,
                districtId,
                from != null ? from.toString() : "N/A",
                to != null ? to.toString() : "N/A"
        );

        return text.getBytes(StandardCharsets.UTF_8);
    }
}

