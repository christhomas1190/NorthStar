package io.northstar.behavior.service;

import io.northstar.behavior.dto.StudentDTO;
import io.northstar.behavior.model.District;
import io.northstar.behavior.model.Student;
import io.northstar.behavior.repository.DistrictRepository;
import io.northstar.behavior.repository.StudentRepository;
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

    private StudentDTO toDto(Student s) {
        return new StudentDTO(
                s.getId(),
                s.getFirstName(),
                s.getLastName(),
                s.getStudentId(),
                s.getGrade(),
                s.getDistrict().getDistrictId()
        );
    }

    @Override
    public StudentDTO create(StudentDTO dto) {
        if (dto == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "body is required");
        }

        if (dto.firstName() == null || dto.lastName() == null || dto.studentId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "missing required fields");
        }

        Long districtId = TenantContext.getDistrictId(); // later: from token or session
        if (districtId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "district not found in context");
        }

        if (repo.existsByStudentIdAndDistrict_DistrictId(dto.studentId(), districtId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "student already exists in district");
        }

        Student s = new Student();
        s.setFirstName(dto.firstName().trim());
        s.setLastName(dto.lastName().trim());
        s.setStudentId(dto.studentId().trim());
        s.setGrade(dto.grade());
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

        List<Student> students = repo.findByDistrict_DistrictId(districtId);
        List<StudentDTO> result = new ArrayList<>();
        for (int i = 0; i < students.size(); i++) {
            result.add(toDto(students.get(i)));
        }
        return result;
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

        if (dto.firstName() != null) s.setFirstName(dto.firstName().trim());
        if (dto.lastName() != null) s.setLastName(dto.lastName().trim());
        if (dto.grade() != null) s.setGrade(dto.grade());

        return toDto(s);
    }

    @Override
    public void delete(Long id) {
        Long districtId = TenantContext.getDistrictId();
        Student s = repo.findByIdAndDistrict_DistrictId(id, districtId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "student not found"));
        repo.delete(s);
    }
}
