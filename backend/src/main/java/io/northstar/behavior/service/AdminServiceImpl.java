package io.northstar.behavior.service;
import java.util.Optional;


import io.northstar.behavior.dto.AdminDTO;
import io.northstar.behavior.model.Admin;
import io.northstar.behavior.model.School;
import io.northstar.behavior.repository.AdminRepository;
import io.northstar.behavior.repository.DistrictRepository;
import io.northstar.behavior.repository.SchoolRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.crossstore.ChangeSetPersister;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class AdminServiceImpl implements AdminService {

    private final AdminRepository repo;
    private final DistrictRepository districts;
    private final SchoolRepository schools;

    @Value("${app.default-admin-password:Admin!2025#}")
    private String defaultAdminPassword;

    public AdminServiceImpl(AdminRepository repo,
                            DistrictRepository districts,
                            SchoolRepository schools) {
        this.repo = repo;
        this.districts = districts;
        this.schools = schools;
    }

    private static String bcrypt(String raw) {
        return org.springframework.security.crypto.bcrypt.BCrypt
                .hashpw(raw, org.springframework.security.crypto.bcrypt.BCrypt.gensalt());
    }

    private AdminDTO toDto(Admin a){
        Long did = (a.getDistrict() != null) ? a.getDistrict().getDistrictId() : null;
        Long sid = (a.getSchool()   != null) ? a.getSchool().getSchoolId()     : null;
        return new AdminDTO(
                a.getId(),
                a.getFirstName(),
                a.getLastName(),
                a.getEmail(),
                a.getUserName(),
                a.getPermissionTag(),
                did,
                sid
        );
    }

    @Override
    public AdminDTO create(AdminDTO dto) {
        if (dto == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "body is required");
        if (dto.firstName() == null || dto.firstName().isBlank()
                || dto.lastName()  == null || dto.lastName().isBlank()
                || dto.email()     == null || dto.email().isBlank()
                || dto.userName()  == null || dto.userName().isBlank()
                || dto.permissionTag() == null || dto.permissionTag().isBlank()
                || dto.districtId() == null
                || dto.schoolId()   == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "missing required fields");
        }

        var district = districts.getReferenceById(dto.districtId());
        School school = schools.findById(dto.schoolId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "school not found"));

        // safety: school must belong to provided district
        if (school.getDistrict() == null ||
                !district.getDistrictId().equals(school.getDistrict().getDistrictId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "school not in given district");
        }

        String email = dto.email().trim().toLowerCase();
        String user  = dto.userName().trim();

        // uniqueness is per SCHOOL (matches your table constraints)
        if (repo.existsByEmailAndSchool_SchoolId(email, school.getSchoolId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "email already exists in this school");
        }
        if (repo.existsByUserNameAndSchool_SchoolId(user, school.getSchoolId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "username already exists in this school");
        }

        Admin a = new Admin();
        a.setFirstName(dto.firstName().trim());
        a.setLastName(dto.lastName().trim());
        a.setEmail(email);
        a.setUserName(user);
        a.setPermissionTag(dto.permissionTag().trim());
        a.setDistrict(district);
        a.setSchool(school); // NOT NULL column
        a.setPasswordHash(bcrypt(defaultAdminPassword)); // NOT NULL column

        return toDto(repo.save(a));
    }

    @Override
    public List<AdminDTO> findAll() {
        List<AdminDTO> out = new ArrayList<>();
        for (var a : repo.findAll()) out.add(toDto(a));
        return out;
    }

    @Override
    public AdminDTO findById(Long id) {
        var a = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "admin not found"));
        return toDto(a);
    }

    @Override
    public AdminDTO update(Long id, AdminDTO dto) {
        var a = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "admin not found"));

        if (dto.firstName() != null && !dto.firstName().isBlank()) a.setFirstName(dto.firstName().trim());
        if (dto.lastName()  != null && !dto.lastName().isBlank())  a.setLastName(dto.lastName().trim());
        if (dto.email()     != null && !dto.email().isBlank())     a.setEmail(dto.email().trim().toLowerCase());
        if (dto.userName()  != null && !dto.userName().isBlank())  a.setUserName(dto.userName().trim());
        if (dto.permissionTag() != null && !dto.permissionTag().isBlank()) a.setPermissionTag(dto.permissionTag().trim());

        if (dto.districtId() != null) {
            var d = districts.getReferenceById(dto.districtId());
            a.setDistrict(d);
        }
        if (dto.schoolId() != null) {
            var s = schools.findById(dto.schoolId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "school not found"));
            a.setSchool(s);
        }

        return toDto(a);
    }
    @Override
    public Optional<Admin> findByUserName(String userName) {
        if (userName == null || userName.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "username is required"
            );
        }

        return repo.findByUserName(userName.trim());
    }


    @Override
    public void delete(Long id) {
        if (!repo.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "admin not found");
        repo.deleteById(id);
    }
}
