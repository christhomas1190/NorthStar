package io.northstar.behavior.service;

import io.northstar.behavior.dto.IncidentSummaryDTO;
import io.northstar.behavior.dto.InterventionSummaryDTO;
import io.northstar.behavior.dto.StudentDTO;
import io.northstar.behavior.model.District;
import io.northstar.behavior.model.Incident;
import io.northstar.behavior.model.Intervention;
import io.northstar.behavior.model.Student;
import io.northstar.behavior.repository.DistrictRepository;
import io.northstar.behavior.repository.StudentRepository;
import io.northstar.behavior.tenant.TenantContext;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class StudentServiceImpl implements StudentService {

    private final StudentRepository repo;
    private final DistrictRepository districtRepo;

    public StudentServiceImpl(StudentRepository repo, DistrictRepository districtRepo) {
        this.repo = repo;
        this.districtRepo = districtRepo;
    }

    // ---------- MAPPERS (for-loops) ----------

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

        return new StudentDTO(
                id,
                s.getFirstName(),
                s.getLastName(),
                s.getStudentId(),
                s.getGrade(),
                toIncidentSummaries(s.getIncidents()),
                toInterventionSummaries(s.getInterventions()),
                did
        );
    }

    // ---------- CRUD (district-aware) ----------

    @Override
    public StudentDTO create(StudentDTO dto) {
        if (dto == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "body is required");
        }
        if (dto.firstName() == null || dto.firstName().isBlank()
                || dto.lastName() == null || dto.lastName().isBlank()
                || dto.studentId() == null || dto.studentId().isBlank()
                || dto.grade() == null || dto.grade().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "missing required fields");
        }

        Long districtId = TenantContext.getDistrictId();
        if (districtId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "district not found in context");
        }

        if (repo.existsByStudentIdAndDistrict_DistrictId(dto.studentId().trim(), districtId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "student already exists in district");
        }

        Student s = new Student();
        s.setFirstName(dto.firstName().trim());
        s.setLastName(dto.lastName().trim());
        s.setStudentId(dto.studentId().trim());
        s.setGrade(dto.grade().trim());
        s.setDistrict(districtRepo.getReferenceById(districtId));

        Student saved = repo.save(s);
        return toDto(saved);
    }

    @Override
    public List<StudentDTO> findAll() {
        Long districtId = TenantContext.getDistrictId();
        if (districtId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "district not found in context");
        }

        List<Student> list = repo.findByDistrict_DistrictId(districtId);
        List<StudentDTO> out = new ArrayList<>();
        for (int i = 0; i < list.size(); i++) {
            out.add(toDto(list.get(i)));
        }
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
        if (dto.lastName() != null && !dto.lastName().isBlank()) s.setLastName(dto.lastName().trim());
        if (dto.grade() != null && !dto.grade().isBlank()) s.setGrade(dto.grade().trim());

        return toDto(s); // managed entity; saved on tx commit
    }

    @Override
    public void delete(Long id) {
        Long districtId = TenantContext.getDistrictId();
        Student s = repo.findByIdAndDistrict_DistrictId(id, districtId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "student not found"));
        repo.delete(s);
    }
}