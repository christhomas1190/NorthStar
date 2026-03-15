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
import io.northstar.behavior.repository.IncidentRepository;
import io.northstar.behavior.repository.InterventionRepository;
import io.northstar.behavior.repository.SchoolRepository;
import io.northstar.behavior.repository.StudentRepository;
import io.northstar.behavior.tenant.TenantContext;
import jakarta.transaction.Transactional;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class StudentServiceImpl implements StudentService {

    private final StudentRepository repo;
    private final DistrictRepository districtRepo;
    private final SchoolRepository schools;
    private final IncidentRepository incidentRepo;
    private final InterventionRepository interventionRepo;

    public StudentServiceImpl(StudentRepository repo,
                              DistrictRepository districtRepo,
                              SchoolRepository schools,
                              IncidentRepository incidentRepo,
                              InterventionRepository interventionRepo) {
        this.repo = repo;
        this.districtRepo = districtRepo;
        this.schools = schools;
        this.incidentRepo = incidentRepo;
        this.interventionRepo = interventionRepo;
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

                Long districtId = (iv.getDistrict() != null) ? iv.getDistrict().getDistrictId() : null;

                Long studentId = null;
                String studentName = null;

                if (iv.getStudent() != null) {
                    studentId = iv.getStudent().getId();
                    String first = iv.getStudent().getFirstName();
                    String last = iv.getStudent().getLastName();
                    studentName = ((first != null) ? first : "") + ((last != null) ? " " + last : "");
                    studentName = studentName.trim();
                }

                out.add(new InterventionSummaryDTO(
                        iv.getId() != null ? iv.getId() : 0L,
                        studentId,
                        studentName,
                        iv.getTier(),
                        iv.getStrategy(),
                        iv.getDescription(),
                        iv.getAssignedBy(),
                        iv.getStartDate(),
                        iv.getEndDate(),
                        districtId
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
        Student student = repo.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "student not found"));

        // Filter incidents by date range
        List<Incident> incidents = incidentRepo.findByStudentIdOrderByOccurredAtDesc(studentId)
                .stream()
                .filter(i -> {
                    LocalDate d = i.getOccurredAt().toLocalDate();
                    return (from == null || !d.isBefore(from)) && (to == null || !d.isAfter(to));
                })
                .toList();

        // Filter interventions by date range
        List<Intervention> interventions = interventionRepo.findByStudent_IdOrderByStartDateDesc(studentId)
                .stream()
                .filter(iv -> {
                    if (iv.getStartDate() == null) return false;
                    return (from == null || !iv.getStartDate().isBefore(from))
                            && (to == null || !iv.getStartDate().isAfter(to));
                })
                .toList();

        try (PDDocument doc = new PDDocument()) {
            PDFont bold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDFont regular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

            final float PAGE_H = PDRectangle.LETTER.getHeight();
            final float PAGE_W = PDRectangle.LETTER.getWidth();
            final float MARGIN = 50f;
            final float USABLE_W = PAGE_W - 2 * MARGIN;
            final float BOTTOM_Y = MARGIN + 30;

            PDPage page = new PDPage(PDRectangle.LETTER);
            doc.addPage(page);
            PDPageContentStream cs = new PDPageContentStream(doc, page);
            float y = PAGE_H - MARGIN;

            // ---- Header ----
            cs.beginText();
            cs.setFont(bold, 18);
            cs.newLineAtOffset(MARGIN, y);
            cs.showText("NorthStar - Student Behavior Report");
            cs.endText();
            y -= 26;

            cs.setLineWidth(0.75f);
            cs.moveTo(MARGIN, y);
            cs.lineTo(PAGE_W - MARGIN, y);
            cs.stroke();
            y -= 16;

            String schoolName = (student.getSchool() != null && student.getSchool().getSchoolName() != null)
                    ? safe(student.getSchool().getSchoolName()) : "School";
            String fromStr = (from != null) ? from.toString() : "N/A";
            String toStr = (to != null) ? to.toString() : "N/A";

            cs.beginText();
            cs.setFont(regular, 10);
            cs.newLineAtOffset(MARGIN, y);
            cs.showText("School: " + schoolName);
            cs.endText();
            y -= 14;

            cs.beginText();
            cs.setFont(regular, 10);
            cs.newLineAtOffset(MARGIN, y);
            cs.showText("Report Period: " + fromStr + " to " + toStr + "   |   Generated: " + LocalDate.now());
            cs.endText();
            y -= 28;

            // ---- Student Info ----
            cs.beginText();
            cs.setFont(bold, 13);
            cs.newLineAtOffset(MARGIN, y);
            cs.showText("Student Information");
            cs.endText();
            y -= 18;

            String firstName = student.getFirstName() != null ? student.getFirstName() : "";
            String lastName  = student.getLastName()  != null ? student.getLastName()  : "";
            String fullName  = (firstName + " " + lastName).trim();
            String[] infoLines = {
                    "Name:        " + safe(fullName),
                    "Student ID:  " + safe(student.getStudentId() != null ? student.getStudentId() : "N/A"),
                    "Grade:       " + safe(student.getGrade() != null ? student.getGrade() : "N/A"),
            };
            for (String line : infoLines) {
                cs.beginText();
                cs.setFont(regular, 10);
                cs.newLineAtOffset(MARGIN + 10, y);
                cs.showText(line);
                cs.endText();
                y -= 14;
            }
            y -= 14;

            // ---- Incidents ----
            cs.beginText();
            cs.setFont(bold, 13);
            cs.newLineAtOffset(MARGIN, y);
            cs.showText("Incidents (" + incidents.size() + ")");
            cs.endText();
            y -= 18;

            if (incidents.isEmpty()) {
                cs.beginText();
                cs.setFont(regular, 10);
                cs.newLineAtOffset(MARGIN + 10, y);
                cs.showText("No incidents in the selected date range.");
                cs.endText();
                y -= 14;
            } else {
                float[] cx = {MARGIN + 5, MARGIN + 90, MARGIN + 165, MARGIN + 240, MARGIN + 325};
                String[] hdrs = {"Date", "Category", "Severity", "Reported By", "Description"};

                cs.setNonStrokingColor(0.9f, 0.9f, 0.9f);
                cs.addRect(MARGIN, y - 3, USABLE_W, 16);
                cs.fill();
                cs.setNonStrokingColor(0f, 0f, 0f);
                for (int i = 0; i < hdrs.length; i++) {
                    cs.beginText();
                    cs.setFont(bold, 9);
                    cs.newLineAtOffset(cx[i], y);
                    cs.showText(hdrs[i]);
                    cs.endText();
                }
                y -= 18;

                for (Incident inc : incidents) {
                    if (y < BOTTOM_Y) {
                        cs.close();
                        page = new PDPage(PDRectangle.LETTER);
                        doc.addPage(page);
                        cs = new PDPageContentStream(doc, page);
                        y = PAGE_H - MARGIN;
                    }
                    String date  = inc.getOccurredAt() != null ? inc.getOccurredAt().toLocalDate().toString() : "";
                    String cat   = safe(inc.getCategory());
                    String sev   = safe(inc.getSeverity());
                    String by    = safe(inc.getReportedBy());
                    String desc  = safe(inc.getDescription());
                    if (desc.length() > 50) desc = desc.substring(0, 47) + "...";
                    String[] vals = {date, cat, sev, by, desc};
                    for (int i = 0; i < vals.length; i++) {
                        cs.beginText();
                        cs.setFont(regular, 9);
                        cs.newLineAtOffset(cx[i], y);
                        cs.showText(vals[i]);
                        cs.endText();
                    }
                    y -= 13;
                }
            }
            y -= 18;

            // Page break if not enough room for the interventions heading
            if (y < BOTTOM_Y + 80) {
                cs.close();
                page = new PDPage(PDRectangle.LETTER);
                doc.addPage(page);
                cs = new PDPageContentStream(doc, page);
                y = PAGE_H - MARGIN;
            }

            // ---- Disciplines / Interventions ----
            cs.beginText();
            cs.setFont(bold, 13);
            cs.newLineAtOffset(MARGIN, y);
            cs.showText("Disciplines / Interventions (" + interventions.size() + ")");
            cs.endText();
            y -= 18;

            if (interventions.isEmpty()) {
                cs.beginText();
                cs.setFont(regular, 10);
                cs.newLineAtOffset(MARGIN + 10, y);
                cs.showText("No disciplines in the selected date range.");
                cs.endText();
                y -= 14;
            } else {
                float[] cx2  = {MARGIN + 5, MARGIN + 60, MARGIN + 185, MARGIN + 300, MARGIN + 375};
                String[] hdrs2 = {"Tier", "Strategy", "Assigned By", "Start", "End"};

                cs.setNonStrokingColor(0.9f, 0.9f, 0.9f);
                cs.addRect(MARGIN, y - 3, USABLE_W, 16);
                cs.fill();
                cs.setNonStrokingColor(0f, 0f, 0f);
                for (int i = 0; i < hdrs2.length; i++) {
                    cs.beginText();
                    cs.setFont(bold, 9);
                    cs.newLineAtOffset(cx2[i], y);
                    cs.showText(hdrs2[i]);
                    cs.endText();
                }
                y -= 18;

                for (Intervention iv : interventions) {
                    if (y < BOTTOM_Y) {
                        cs.close();
                        page = new PDPage(PDRectangle.LETTER);
                        doc.addPage(page);
                        cs = new PDPageContentStream(doc, page);
                        y = PAGE_H - MARGIN;
                    }
                    String tier       = safe(iv.getTier());
                    String strategy   = safe(iv.getStrategy());
                    if (strategy.length() > 45) strategy = strategy.substring(0, 42) + "...";
                    String assignedBy = safe(iv.getAssignedBy());
                    String startDate  = iv.getStartDate() != null ? iv.getStartDate().toString() : "";
                    String endDate    = iv.getEndDate()   != null ? iv.getEndDate().toString()   : "Ongoing";
                    String[] vals2 = {tier, strategy, assignedBy, startDate, endDate};
                    for (int i = 0; i < vals2.length; i++) {
                        cs.beginText();
                        cs.setFont(regular, 9);
                        cs.newLineAtOffset(cx2[i], y);
                        cs.showText(vals2[i]);
                        cs.endText();
                    }
                    y -= 13;
                }
            }

            cs.close();
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "PDF generation failed: " + e.getMessage());
        }
    }

    /** Strip characters outside Latin-1 printable range (PDType1Font limitation). */
    private static String safe(String s) {
        if (s == null) return "";
        StringBuilder sb = new StringBuilder(s.length());
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c >= 0x20 && c <= 0xFF) sb.append(c);
            else if (c == '\t') sb.append(' ');
        }
        return sb.toString();
    }
}

