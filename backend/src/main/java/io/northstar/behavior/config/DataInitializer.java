package io.northstar.behavior.config;

import io.northstar.behavior.model.Admin;
import io.northstar.behavior.model.District;
import io.northstar.behavior.model.School;
import io.northstar.behavior.repository.AdminRepository;
import io.northstar.behavior.repository.DistrictRepository;
import io.northstar.behavior.repository.SchoolRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeds a default admin user (admin / Admin!2025#) on first startup.
 * Safe to run on every restart — only creates data if the admin doesn't exist.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private final DistrictRepository districtRepo;
    private final SchoolRepository schoolRepo;
    private final AdminRepository adminRepo;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(DistrictRepository districtRepo,
                           SchoolRepository schoolRepo,
                           AdminRepository adminRepo,
                           PasswordEncoder passwordEncoder) {
        this.districtRepo = districtRepo;
        this.schoolRepo = schoolRepo;
        this.adminRepo = adminRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (adminRepo.findByUserName("admin").isPresent()) {
            return; // already seeded
        }

        // Find or create a district
        District district = districtRepo.findById(1L).orElseGet(() ->
                districtRepo.findAll().stream().findFirst().orElseGet(() -> {
                    District d = new District();
                    d.setDistrictName("Springfield USD");
                    d.setStatus("ACTIVE");
                    return districtRepo.save(d);
                })
        );

        // Find or create a school inside that district
        School school = schoolRepo.findById(1L).orElseGet(() ->
                schoolRepo.findByDistrict_DistrictId(district.getDistrictId())
                        .stream().findFirst().orElseGet(() -> {
                            School s = new School();
                            s.setSchoolName("Lincoln Middle School");
                            s.setDistrict(district);
                            return schoolRepo.save(s);
                        })
        );

        Admin admin = new Admin();
        admin.setFirstName("System");
        admin.setLastName("Admin");
        admin.setEmail("admin@northstar.local");
        admin.setUserName("admin");
        admin.setPasswordHash(passwordEncoder.encode("Admin!2025#"));
        admin.setPermissionTag("FULL");
        admin.setDistrict(district);
        admin.setSchool(school);
        adminRepo.save(admin);

        System.out.println("[NorthStar] Seeded admin user: admin / Admin!2025#");
    }
}
