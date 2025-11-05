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

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false)
    private String name;

    // Parent tenant node
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "district_id", nullable = false)
    private District district;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public District getDistrict() { return district; }
    public void setDistrict(District district) { this.district = district; }
}
