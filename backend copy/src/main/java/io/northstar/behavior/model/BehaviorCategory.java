package io.northstar.behavior.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "behavior_categories")
public class BehaviorCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String severity;

    @Column(nullable = false)
    private String tier;

    @Column(length = 500)
    private String description;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="district_id", nullable=false)
    private District district;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="school_id", nullable=false)
    private School school;

    public BehaviorCategory() {}

    public BehaviorCategory(String name, String severity, String tier, String description) {
        this.name = name;
        this.severity = severity;
        this.tier = tier;
        this.description = description;
    }

    // --- getters & setters ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getTier() { return tier; }
    public void setTier(String tier) { this.tier = tier; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public District getDistrict() {
        return district;
    }

    public void setDistrict(District district) {
        this.district = district;
    }

    public School getSchool() {
        return school;
    }

    public void setSchool(School school) {
        this.school = school;
    }
}
