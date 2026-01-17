// src/main/java/io/northstar/behavior/model/AdminNotification.java
package io.northstar.behavior.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
public class AdminNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Admin admin;

    @ManyToOne(optional = false)
    private Student student;

    @ManyToOne(optional = false)
    private Incident incident;

    @ManyToOne(optional = false)
    @JoinColumn(name = "escalation_rules_id")
    private EscalationRules rule;

    private String message;

    private OffsetDateTime createdAt;

    private boolean read;

    protected AdminNotification() {}

    public AdminNotification(Admin admin,
                             Student student,
                             Incident incident,
                             EscalationRules rule,
                             String message) {
        this.admin = admin;
        this.student = student;
        this.incident = incident;
        this.rule = rule;
        this.message = message;
        this.createdAt = OffsetDateTime.now();
        this.read = false;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Admin getAdmin() {
        return admin;
    }

    public void setAdmin(Admin admin) {
        this.admin = admin;
    }

    public Student getStudent() {
        return student;
    }

    public void setStudent(Student student) {
        this.student = student;
    }

    public Incident getIncident() {
        return incident;
    }

    public void setIncident(Incident incident) {
        this.incident = incident;
    }

    public EscalationRules getRule() {
        return rule;
    }

    public void setRule(EscalationRules rule) {
        this.rule = rule;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isRead() {
        return read;
    }

    public void setRead(boolean read) {
        this.read = read;
    }
}
