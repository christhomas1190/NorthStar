// src/main/java/io/northstar/behavior/service/AdminServiceImpl.java
package io.northstar.behavior.service;

import io.northstar.behavior.dto.AdminDTO;
import io.northstar.behavior.model.Admin;
import io.northstar.behavior.model.District;
import io.northstar.behavior.repository.AdminRepository;
import io.northstar.behavior.repository.DistrictRepository;
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
    private final DistrictRepository districtRepo;

    @Value("${app.default-admin-password:Admin!2025#}")
    private String defaultAdminPassword;

    public AdminServiceImpl(AdminRepository repo, DistrictRepository districtRepo) {
        this.repo = repo;
        this.districtRepo = districtRepo;
    }

    private AdminDTO toDto(Admin a) {
        Long did = (a.getDistrict() != null) ? a.getDistrict().getDistrictId() : null; // <-- FIXED
        return new AdminDTO(
                a.getId(),
                a.getFirstName(),
                a.getLastName(),
                a.getEmail(),
                a.getUserName(),
                a.getPermissionTag(),
                did
        );
    }

    private String normalize(String s){
        if (s == null) return "";
        String base = Normalizer.normalize(s.toLowerCase(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return base.replaceAll("[^a-z]", "");
    }

    private String generateUsername(String firstName, String lastName, Long districtId){
        String f = normalize(firstName);
        String l = normalize(lastName);
        if (f.isEmpty() || l.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid names");
        }
        String cand = f.substring(0,1) + l;
        if (!repo.existsByUserNameAndDistrict_DistrictId(cand, districtId)) return cand;

        if (f.length() >= 2) {
            String c2 = f.substring(0,2) + l;
            if (!repo.existsByUserNameAndDistrict_DistrictId(c2, districtId)) return c2;
            cand = c2;
        }
        int n = 1;
        while (repo.existsByUserNameAndDistrict_DistrictId(cand + n, districtId)) n++;
        return cand + n;
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
        if (dto.districtId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "districtId is required");
        }

        String email = dto.email().trim().toLowerCase();
        if (repo.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "email already exists");
        }

        District d = districtRepo.getReferenceById(dto.districtId());

        Admin a = new Admin();
        a.setFirstName(dto.firstName().trim());
        a.setLastName(dto.lastName().trim());
        a.setEmail(email);
        a.setDistrict(d); // entity, not String
        a.setUserName(generateUsername(a.getFirstName(), a.getLastName(), d.getDistrictId()));
        a.setPasswordHash(bcrypt(defaultAdminPassword));
        a.setPermissionTag("SUPER_ADMIN");

        return toDto(repo.save(a));
    }

    @Override
    public List<AdminDTO> findAll() {
        List<Admin> list = repo.findAll();
        List<AdminDTO> out = new ArrayList<>();
        for (int i = 0; i < list.size(); i++) out.add(toDto(list.get(i)));
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
        if (dto.firstName() != null && !dto.firstName().isBlank()) a.setFirstName(dto.firstName().trim());
        if (dto.lastName() != null && !dto.lastName().isBlank())   a.setLastName(dto.lastName().trim());
        if (dto.email() != null && !dto.email().isBlank()) {
            String newEmail = dto.email().trim().toLowerCase();
            if (!newEmail.equals(a.getEmail()) && repo.existsByEmail(newEmail)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "email already exists");
            }
            a.setEmail(newEmail);
        }
        if (dto.districtId() != null) {
            a.setDistrict(districtRepo.getReferenceById(dto.districtId())); // entity
        }
        return toDto(a);
    }

    @Override
    public void delete(Long id) {
        if (!repo.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin not found");
        repo.deleteById(id);
    }
}
