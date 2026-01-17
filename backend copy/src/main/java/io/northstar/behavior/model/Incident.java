package io.northstar.behavior.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(
        name = "incidents",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_incident_id_per_district", columnNames = {"district_id", "id"})
        }
)
public class Incident {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "student_id", insertable = false, updatable = false)
    private Long studentId;

    @Column(nullable = false) private String category;
    @Column(nullable = false, length = 1000) private String description;
    @Column(nullable = false) private String severity;
    @Column(nullable = false) private String reportedBy;

    @Column(nullable = false) private OffsetDateTime occurredAt;
    @Column(nullable = false) private OffsetDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="district_id", nullable=false)
    private District district;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="school_id", nullable=false)
    private School school;

    // getters/setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Student getStudent() { return student; }
    public void setStudent(Student student) { this.student = student; }

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getReportedBy() { return reportedBy; }
    public void setReportedBy(String reportedBy) { this.reportedBy = reportedBy; }

    public OffsetDateTime getOccurredAt() { return occurredAt; }
    public void setOccurredAt(OffsetDateTime occurredAt) { this.occurredAt = occurredAt; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public District getDistrict() { return district; }
    public void setDistrict(District district) { this.district = district; }

    public School getSchool() { return school; }
    public void setSchool(School school) { this.school = school; }
}
