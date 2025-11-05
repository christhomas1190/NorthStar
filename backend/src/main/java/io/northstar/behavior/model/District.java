// src/main/java/io/northstar/behavior/model/District.java
package io.northstar.behavior.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "district") // keep existing table name
public class District {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long districtId;

    @Column(nullable = false)
    private String districtName;

    @Column(nullable = false)
    private String slug;  // e.g., "cherry-hill"

    @Column(nullable = false)
    private String status = "ACTIVE"; // ACTIVE | SUSPENDED | PENDING

    @Column(nullable = false)
    private Integer seatLimit = 100;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    // Make these nullable so simple creates don't fail
    @Column(nullable = true)
    private String billingEmail;

    @Column(nullable = true)
    private String contactName;
    @Version
    private Long version;

    @Column(name="max_schools", nullable=false)
    private int maxSchools = 100;

    public Long getDistrictId() { return districtId; }
    public void setDistrictId(Long districtId) { this.districtId = districtId; }

    public String getDistrictName() { return districtName; }
    public void setDistrictName(String districtName) { this.districtName = districtName; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getSeatLimit() { return seatLimit; }
    public void setSeatLimit(Integer seatLimit) { this.seatLimit = seatLimit; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public String getBillingEmail() { return billingEmail; }
    public void setBillingEmail(String billingEmail) { this.billingEmail = billingEmail; }

    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    public int getMaxSchools() {
        return maxSchools;
    }

    public void setMaxSchools(int maxSchools) {
        this.maxSchools = maxSchools;
    }


}
