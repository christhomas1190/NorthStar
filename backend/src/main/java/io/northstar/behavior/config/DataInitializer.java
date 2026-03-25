package io.northstar.behavior.config;

import io.northstar.behavior.model.Admin;
import io.northstar.behavior.model.District;
import io.northstar.behavior.model.GradeCategory;
import io.northstar.behavior.model.School;
import io.northstar.behavior.model.Teacher;
import io.northstar.behavior.repository.AdminRepository;
import io.northstar.behavior.repository.DistrictRepository;
import io.northstar.behavior.repository.GradeCategoryRepository;
import io.northstar.behavior.repository.SchoolRepository;
import io.northstar.behavior.repository.TeacherRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeds a default admin + teacher on first startup.
 * Also seeds default GradeCategory records for the teacher.
 * Safe to run on every restart — only creates data if the admin doesn't exist.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private final DistrictRepository districtRepo;
    private final SchoolRepository schoolRepo;
    private final AdminRepository adminRepo;
    private final TeacherRepository teacherRepo;
    private final GradeCategoryRepository gradeCategoryRepo;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(DistrictRepository districtRepo,
                           SchoolRepository schoolRepo,
                           AdminRepository adminRepo,
                           TeacherRepository teacherRepo,
                           GradeCategoryRepository gradeCategoryRepo,
                           PasswordEncoder passwordEncoder) {
        this.districtRepo = districtRepo;
        this.schoolRepo = schoolRepo;
        this.adminRepo = adminRepo;
        this.teacherRepo = teacherRepo;
        this.gradeCategoryRepo = gradeCategoryRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (adminRepo.findByUserName("cthomas").isPresent()) {
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
        admin.setFirstName("C");
        admin.setLastName("Thomas");
        admin.setEmail("cthomas@northstar.local");
        admin.setUserName("cthomas");
        admin.setPasswordHash(passwordEncoder.encode("Bronson1"));
        admin.setPermissionTag("FULL");
        admin.setDistrict(district);
        admin.setSchool(school);
        adminRepo.save(admin);

        Teacher teacher = new Teacher();
        teacher.setFirstName("J");
        teacher.setLastName("Thomas");
        teacher.setEmail("jthomas@northstar.local");
        teacher.setUserName("jthomas");
        teacher.setPasswordHash(passwordEncoder.encode("jbros1"));
        teacher.setDistrict(district);
        teacher.setSchool(school);
        Teacher savedTeacher = teacherRepo.save(teacher);

        // Seed default grade categories for the teacher
        seedDefaultCategories(savedTeacher, district);

        System.out.println("[NorthStar] Seeded admin: cthomas / Bronson1");
        System.out.println("[NorthStar] Seeded teacher: jthomas / jbros1");
        System.out.println("[NorthStar] Seeded default grade categories for jthomas");
    }

    public void seedDefaultCategories(Teacher teacher, District district) {
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
                cat.setDistrict(district);
                cat.setName(row[0]);
                cat.setWeightPercent(Integer.parseInt(row[1]));
                gradeCategoryRepo.save(cat);
            }
        }
    }
}
