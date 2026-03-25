package io.northstar.behavior.model;

import jakarta.persistence.*;

@Entity
@Table(
    name = "grade_category",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_grade_category_teacher_name",
        columnNames = {"teacher_id", "name"}
    )
)
public class GradeCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "district_id", nullable = false)
    private District district;

    @Column(nullable = false)
    private String name;

    @Column(name = "weight_percent", nullable = false)
    private int weightPercent;

    public GradeCategory() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Teacher getTeacher() { return teacher; }
    public void setTeacher(Teacher teacher) { this.teacher = teacher; }

    public District getDistrict() { return district; }
    public void setDistrict(District district) { this.district = district; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getWeightPercent() { return weightPercent; }
    public void setWeightPercent(int weightPercent) { this.weightPercent = weightPercent; }
}
