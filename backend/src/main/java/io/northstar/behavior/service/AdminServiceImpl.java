// src/main/java/io/northstar/behavior/service/AdminServiceImpl.java
package io.northstar.behavior.service;

import io.northstar.behavior.dto.AdminDTO;
import io.northstar.behavior.model.Admin;
import io.northstar.behavior.model.School;
import io.northstar.behavior.repository.AdminRepository;
import io.northstar.behavior.repository.DistrictRepository;
import io.northstar.behavior.repository.SchoolRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
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
        Long sid = (a.getSchool()   != null) ? a.getSchool().getSchoolId()           : null; // if you added school
        return new AdminDTO(
                a.getId(),
                a.getFirstName(),
                a.getLastName(),
                a.getEmail(),
                a.getUserName(),
                a.getPermissionTag(),
                did,
                sid // if your AdminDTO has schoolId; if not, remove this and the param above
        );
    }

    @Override
    public AdminDTO create(AdminDTO dto) {
        if (dto == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "body is required");
        if (dto.firstName() == null || dto.firstName().isBlank()
                || dto.lastName() == null || dto.lastName().isBlank()
                || dto.email() == null || dto.email().isBlank()
                || dto.userName() == null || dto.userName().isBlank()
                || dto.permissionTag() == null || dto.permissionTag().isBlank()
                || dto.districtId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "missing required fields");
        }

        String email = dto.email().trim().toLowerCase();
        String user  = dto.userName().trim();

        if (repo.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "email already exists");
        }
        if (repo.existsByUserNameAndDistrict_DistrictId(user, dto.districtId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "username already exists in district");
        }

        var district = districts.getReferenceById(dto.districtId());

        School school = null;
        if (dto.schoolId() != null) {
            school = schools.findById(dto.schoolId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "school not found"));
            if (school.getDistrict() == null ||
                    !district.getDistrictId().equals(school.getDistrict().getDistrictId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "school not in given district");
            }
        }

        Admin a = new Admin();
        a.setFirstName(dto.firstName().trim());
        a.setLastName(dto.lastName().trim());
        a.setEmail(email);
        a.setUserName(user);
        a.setPermissionTag(dto.permissionTag().trim());
        a.setDistrict(district);
        if (school != null) a.setSchool(school); // requires Admin entity to have a `School school` field
        a.setPasswordHash(bcrypt(defaultAdminPassword)); // <<< CRITICAL: satisfies NOT NULL

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
        if (dto.districtId() != null) a.setDistrict(districts.getReferenceById(dto.districtId()));
        if (dto.schoolId()   != null) {
            var school = schools.findById(dto.schoolId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "school not found"));
            a.setSchool(school);
        }

        return toDto(a);
    }

    @Override
    public void delete(Long id) {
        if (!repo.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "admin not found");
        repo.deleteById(id);
    }
}
