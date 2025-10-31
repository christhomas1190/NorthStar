package io.northstar.behavior.model;


import jakarta.persistence.*;

@Entity
@Table(
        name = "teachers",
        uniqueConstraints = {
                @UniqueConstraint(name="uk_teacher_email_per_district", columnNames={"district_id","email"}),
                @UniqueConstraint(name="uk_teacher_username_per_district", columnNames={"district_id","username"})
        }
)
public class Teacher {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String firstName;
    @Column(nullable = false)
    private String lastName;
    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, unique = true)
    private String username;         // auto-generated (see service)

    @Column(nullable = false)
    private String passwordHash; // BCrypt hash of default password

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="district_id", nullable=false)
    private District district;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }
}
