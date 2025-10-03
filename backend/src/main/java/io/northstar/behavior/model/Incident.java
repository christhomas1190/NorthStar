package io.northstar.behavior.model;


import jakarta.persistence.*;
import org.springframework.boot.autoconfigure.domain.EntityScan;

@EntityScan
@Table(name="incident")
public class Incident {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_fk")
    private Student student;
    @Column(nullable = false)
    private String category;
    @Column(nullable = false)
    private String description;
    @Column(nullable = false)
    private String severity;
    @Column(nullable = false)
    private String reportedBy;



}
