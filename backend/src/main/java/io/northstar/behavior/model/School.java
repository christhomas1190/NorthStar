package io.northstar.behavior.model;

import jakarta.persistence.*;

@Entity
@Table(
        name = "schools",
        uniqueConstraints = {
                @UniqueConstraint(name="uk_school_name_per_district", columnNames={"district_id","name"})
        }
)
public class School {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long schoolId; // << was id

    @Column(nullable=false)
    private String schoolName;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "district_id", nullable = false)
    private District district;

    public Long getSchoolId() { return schoolId; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }

    public String getSchoolName() { return schoolName; }
    public void setSchoolName(String name) { this.schoolName = name; }

    public District getDistrict() { return district; }
    public void setDistrict(District district) { this.district = district; }


}
