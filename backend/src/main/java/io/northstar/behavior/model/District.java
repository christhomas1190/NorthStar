package io.northstar.behavior.model;

import jakarta.persistence.*;

import java.time.Instant;


@Entity
@Table(name="district")
public class District {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long districtId;

    @Column (nullable = false)
    private String districtName;
    @Column(nullable=false) private String slug;         // "cherry-hill"
    @Column(nullable=false) private String status = "ACTIVE"; // ACTIVE | SUSPENDED | PENDING
    @Column(nullable=false) private Integer seatLimit = 100;  // optional; helps enforce license
    @Column(nullable=false) private Instant createdAt = Instant.now();
    @Column(nullable=false) private String billingEmail;
    @Column(nullable=false) private String contactName;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="district_id", nullable=false)
    private District district;

    public Long getDistrictId() {
        return districtId;
    }

    public void setDistrictId(Long districtId) {
        this.districtId = districtId;
    }

    public String getDistrictName() {
        return districtName;
    }

    public void setDistrictName(String districtName) {
        this.districtName = districtName;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getSeatLimit() {
        return seatLimit;
    }

    public void setSeatLimit(Integer seatLimit) {
        this.seatLimit = seatLimit;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public String getBillingEmail() {
        return billingEmail;
    }

    public void setBillingEmail(String billingEmail) {
        this.billingEmail = billingEmail;
    }

    public String getContactName() {
        return contactName;
    }

    public void setContactName(String contactName) {
        this.contactName = contactName;
    }
}
