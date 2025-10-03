package io.northstar.behavior.model;

import jakarta.persistence.*;
import org.springframework.boot.autoconfigure.domain.EntityScan;


@EntityScan
@Table(name="students")
public class Student {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false)
    private Long id;
    @Column(nullable = false)
    private String firstName;
    @Column(nullable = false)
    private String lastName;
    @Column(nullable = false)
    private String studentId;
    @Column(nullable = false)
    private String  grade;

}
