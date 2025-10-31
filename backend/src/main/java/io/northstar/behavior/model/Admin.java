package io.northstar.behavior.model;

import jakarta.annotation.Nullable;
import jakarta.persistence.*;

@Entity
@Table(
        name = "admin",
        uniqueConstraints = {
                @UniqueConstraint(name="uk_admin_email_per_district", columnNames={"district_id","email"}),
                @UniqueConstraint(name="uk_admin_username_per_district", columnNames={"district_id","username"})
        })
public class Admin {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false) private String firstName;
    @Column(nullable=false) private String lastName;
    @Column(nullable=false) private String email;
    @Column(nullable=false) private String userName;
    @Column(nullable=false) private String passwordHash;

    @Column(nullable=false)
    private String permissionTag; // e.g., "SUPER_ADMIN", "ADMIN"
    @Column(nullable=false)
    private String districtId;

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

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getPermissionTag() {
        return permissionTag;
    }

    public void setPermissionTag(String permissionTag) {
        this.permissionTag = permissionTag;
    }

    public String getDistrictId() {
        return districtId;
    }

    public void setDistrictId(String districtId) {
        this.districtId = districtId;
    }
}
