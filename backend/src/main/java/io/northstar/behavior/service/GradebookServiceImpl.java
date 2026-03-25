package io.northstar.behavior.service;

import io.northstar.behavior.dto.*;
import io.northstar.behavior.model.*;
import io.northstar.behavior.repository.AssignmentRepository;
import io.northstar.behavior.repository.DistrictRepository;
import io.northstar.behavior.repository.GradeCategoryRepository;
import io.northstar.behavior.repository.GradeRepository;
import io.northstar.behavior.repository.StudentRepository;
import io.northstar.behavior.repository.TeacherRepository;
import io.northstar.behavior.tenant.TenantContext;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.*;

@Service
@Transactional
public class GradebookServiceImpl implements GradebookService {

    private final GradeCategoryRepository categoryRepo;
    private final AssignmentRepository assignmentRepo;
    private final GradeRepository gradeRepo;
    private final TeacherRepository teacherRepo;
    private final DistrictRepository districtRepo;
    private final StudentRepository studentRepo;

    public GradebookServiceImpl(GradeCategoryRepository categoryRepo,
                                 AssignmentRepository assignmentRepo,
                                 GradeRepository gradeRepo,
                                 TeacherRepository teacherRepo,
                                 DistrictRepository districtRepo,
                                 StudentRepository studentRepo) {
        this.categoryRepo = categoryRepo;
        this.assignmentRepo = assignmentRepo;
        this.gradeRepo = gradeRepo;
        this.teacherRepo = teacherRepo;
        this.districtRepo = districtRepo;
        this.studentRepo = studentRepo;
    }

    // ---- helpers ----

    private District assertGradebookEnabled() {
        Long districtId = TenantContext.getDistrictId();
        if (districtId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "district context missing");
        District d = districtRepo.findById(districtId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "district not found"));
        if (!d.isHasGradebook()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Gradebook not enabled for this district");
        }
        return d;
    }

    private Teacher currentTeacher(District d) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return teacherRepo.findByUserName(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Gradebook requires a teacher account"));
    }

    private GradeCategoryDTO toDto(GradeCategory c) {
        return new GradeCategoryDTO(c.getId(), c.getName(), c.getWeightPercent(),
                c.getTeacher() != null ? c.getTeacher().getId() : null);
    }

    private AssignmentDTO toDto(Assignment a) {
        String teacherName = a.getTeacher() != null
                ? a.getTeacher().getFirstName() + " " + a.getTeacher().getLastName()
                : null;
        String categoryName = a.getCategory() != null ? a.getCategory().getName() : null;
        Long teacherId = a.getTeacher() != null ? a.getTeacher().getId() : null;
        Long categoryId = a.getCategory() != null ? a.getCategory().getId() : null;
        return new AssignmentDTO(a.getId(), a.getName(), a.getSubject(), a.getDueDate(),
                a.getMaxPoints(), categoryId, categoryName, teacherId, teacherName);
    }

    private GradeDTO toDto(Grade g) {
        Assignment a = g.getAssignment();
        String teacherName = a.getTeacher() != null
                ? a.getTeacher().getFirstName() + " " + a.getTeacher().getLastName()
                : null;
        String categoryName = a.getCategory() != null ? a.getCategory().getName() : null;
        return new GradeDTO(g.getId(),
                g.getStudent() != null ? g.getStudent().getId() : null,
                a.getId(),
                a.getName(),
                a.getSubject(),
                g.getPointsEarned(),
                a.getMaxPoints(),
                categoryName,
                teacherName,
                g.getEnteredAt());
    }

    // ---- categories ----

    @Override
    public List<GradeCategoryDTO> getCategories() {
        District d = assertGradebookEnabled();
        Teacher t = currentTeacher(d);
        List<GradeCategory> cats = categoryRepo.findByTeacher_IdAndDistrict_DistrictId(t.getId(), d.getDistrictId());
        List<GradeCategoryDTO> out = new ArrayList<>();
        for (GradeCategory c : cats) out.add(toDto(c));
        return out;
    }

    @Override
    public GradeCategoryDTO createCategory(CreateCategoryRequest req) {
        District d = assertGradebookEnabled();
        Teacher t = currentTeacher(d);
        if (req.name() == null || req.name().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name required");
        }
        if (categoryRepo.existsByTeacher_IdAndName(t.getId(), req.name().trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "category already exists");
        }
        GradeCategory c = new GradeCategory();
        c.setTeacher(t);
        c.setDistrict(d);
        c.setName(req.name().trim());
        c.setWeightPercent(req.weightPercent());
        return toDto(categoryRepo.save(c));
    }

    @Override
    public GradeCategoryDTO updateCategory(Long id, CreateCategoryRequest req) {
        District d = assertGradebookEnabled();
        Teacher t = currentTeacher(d);
        GradeCategory c = categoryRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "category not found"));
        if (!c.getTeacher().getId().equals(t.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "not your category");
        }
        if (req.name() != null && !req.name().isBlank()) c.setName(req.name().trim());
        c.setWeightPercent(req.weightPercent());
        return toDto(c);
    }

    @Override
    public void deleteCategory(Long id) {
        District d = assertGradebookEnabled();
        Teacher t = currentTeacher(d);
        GradeCategory c = categoryRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "category not found"));
        if (!c.getTeacher().getId().equals(t.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "not your category");
        }
        if (!assignmentRepo.findByCategory_Id(id).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "category has assignments; delete them first");
        }
        categoryRepo.delete(c);
    }

    // ---- assignments ----

    @Override
    public List<AssignmentDTO> getAssignments() {
        District d = assertGradebookEnabled();
        Teacher t = currentTeacher(d);
        List<Assignment> list = assignmentRepo.findByTeacher_IdAndDistrict_DistrictId(t.getId(), d.getDistrictId());
        List<AssignmentDTO> out = new ArrayList<>();
        for (Assignment a : list) out.add(toDto(a));
        return out;
    }

    @Override
    public AssignmentDTO createAssignment(CreateAssignmentRequest req) {
        District d = assertGradebookEnabled();
        Teacher t = currentTeacher(d);
        if (req.name() == null || req.name().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name required");
        }
        if (req.maxPoints() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "maxPoints must be > 0");
        }
        GradeCategory cat = categoryRepo.findById(req.categoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "category not found"));
        if (!cat.getTeacher().getId().equals(t.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "not your category");
        }
        Assignment a = new Assignment();
        a.setTeacher(t);
        a.setDistrict(d);
        a.setCategory(cat);
        a.setName(req.name().trim());
        a.setSubject(req.subject());
        a.setDueDate(req.dueDate());
        a.setMaxPoints(req.maxPoints());
        return toDto(assignmentRepo.save(a));
    }

    @Override
    public AssignmentDTO updateAssignment(Long id, CreateAssignmentRequest req) {
        District d = assertGradebookEnabled();
        Teacher t = currentTeacher(d);
        Assignment a = assignmentRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "assignment not found"));
        if (!a.getTeacher().getId().equals(t.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "not your assignment");
        }
        if (req.name() != null && !req.name().isBlank()) a.setName(req.name().trim());
        a.setSubject(req.subject());
        a.setDueDate(req.dueDate());
        if (req.maxPoints() > 0) a.setMaxPoints(req.maxPoints());
        if (req.categoryId() != null) {
            GradeCategory cat = categoryRepo.findById(req.categoryId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "category not found"));
            if (!cat.getTeacher().getId().equals(t.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "not your category");
            }
            a.setCategory(cat);
        }
        return toDto(a);
    }

    @Override
    public void deleteAssignment(Long id) {
        District d = assertGradebookEnabled();
        Teacher t = currentTeacher(d);
        Assignment a = assignmentRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "assignment not found"));
        if (!a.getTeacher().getId().equals(t.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "not your assignment");
        }
        assignmentRepo.delete(a);
    }

    // ---- grades ----

    @Override
    public List<GradeDTO> getGradesForStudent(Long studentId) {
        District d = assertGradebookEnabled();
        List<Grade> grades = gradeRepo.findByStudent_IdAndDistrict_DistrictId(studentId, d.getDistrictId());
        List<GradeDTO> out = new ArrayList<>();
        for (Grade g : grades) out.add(toDto(g));
        return out;
    }

    @Override
    public GradeDTO upsertGrade(UpsertGradeRequest req) {
        District d = assertGradebookEnabled();
        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        Assignment a = assignmentRepo.findById(req.assignmentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "assignment not found"));
        if (!a.getDistrict().getDistrictId().equals(d.getDistrictId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "assignment not in district");
        }

        Student student = studentRepo.findByIdAndDistrict_DistrictId(req.studentId(), d.getDistrictId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "student not found"));

        Grade g = gradeRepo.findByStudent_IdAndAssignment_Id(req.studentId(), req.assignmentId())
                .orElseGet(() -> {
                    Grade newGrade = new Grade();
                    newGrade.setStudent(student);
                    newGrade.setAssignment(a);
                    newGrade.setDistrict(d);
                    newGrade.setEnteredBy(username);
                    return newGrade;
                });

        g.setPointsEarned(req.pointsEarned());
        g.setEnteredBy(username);
        g.setEnteredAt(OffsetDateTime.now());
        return toDto(gradeRepo.save(g));
    }

    @Override
    public void deleteGrade(Long gradeId) {
        assertGradebookEnabled();
        Grade g = gradeRepo.findById(gradeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "grade not found"));
        gradeRepo.delete(g);
    }

    // ---- summary ----

    @Override
    public List<GradebookSummaryDTO> getSummary() {
        District d = assertGradebookEnabled();
        Teacher t = currentTeacher(d);

        List<GradeCategory> cats = categoryRepo.findByTeacher_IdAndDistrict_DistrictId(t.getId(), d.getDistrictId());
        List<Assignment> assignments = assignmentRepo.findByTeacher_IdAndDistrict_DistrictId(t.getId(), d.getDistrictId());
        List<Student> students = studentRepo.findByDistrict_DistrictId(d.getDistrictId());

        List<GradebookSummaryDTO> out = new ArrayList<>();
        for (Student s : students) {
            List<Grade> grades = gradeRepo.findByStudent_IdAndDistrict_DistrictId(s.getId(), d.getDistrictId());
            Map<Long, Grade> gradeByAssignment = new HashMap<>();
            for (Grade g : grades) gradeByAssignment.put(g.getAssignment().getId(), g);

            Map<String, Double> breakdown = new LinkedHashMap<>();
            double weightedAvg = 0;
            int totalWeight = 0;

            for (GradeCategory cat : cats) {
                List<Assignment> catAssignments = new ArrayList<>();
                for (Assignment a : assignments) {
                    if (a.getCategory().getId().equals(cat.getId())) catAssignments.add(a);
                }
                if (catAssignments.isEmpty()) continue;

                int sumEarned = 0, sumMax = 0;
                boolean hasAny = false;
                for (Assignment a : catAssignments) {
                    Grade g = gradeByAssignment.get(a.getId());
                    if (g != null && g.getPointsEarned() != null) {
                        sumEarned += g.getPointsEarned();
                        sumMax += a.getMaxPoints();
                        hasAny = true;
                    }
                }
                if (!hasAny || sumMax == 0) continue;

                double catScore = (sumEarned * 100.0) / sumMax;
                breakdown.put(cat.getName(), Math.round(catScore * 10.0) / 10.0);
                weightedAvg += catScore * cat.getWeightPercent() / 100.0;
                totalWeight += cat.getWeightPercent();
            }

            if (totalWeight > 0) {
                weightedAvg = weightedAvg * 100.0 / totalWeight;
            } else {
                weightedAvg = 0;
            }

            double finalAvg = Math.round(weightedAvg * 10.0) / 10.0;
            String letter = letterGrade(finalAvg);
            String name = s.getFirstName() + " " + s.getLastName();
            out.add(new GradebookSummaryDTO(s.getId(), name, finalAvg, letter, breakdown));
        }
        return out;
    }

    private String letterGrade(double avg) {
        if (avg >= 90) return "A";
        if (avg >= 80) return "B";
        if (avg >= 70) return "C";
        if (avg >= 60) return "D";
        return "F";
    }
}
