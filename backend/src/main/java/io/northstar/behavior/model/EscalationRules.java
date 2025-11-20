package io.northstar.behavior.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(
  name = "escalation_rules",
  uniqueConstraints = @UniqueConstraint(name="uk_rules_district_school", columnNames = {"district_id","school_id"})
)
public class EscalationRules {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "district_id", nullable = false)
  private District district;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "school_id")
  private School school;

  @Column(nullable = false) private Integer tier1WindowDays;
  @Column(nullable = false) private Integer reviewEveryDays;

  @Column(nullable = false) private Integer sameCautionDetentionThreshold;
  @Column(nullable = false) private Integer mixedCautionDetentionThreshold;
  @Column(nullable = false) private Integer sameCautionTier2Threshold;

  @Column(nullable = false) private String  detentionLabel;
  @Column(nullable = false) private Integer detentionDurationDays;
  @Column(nullable = false) private String  tier2Label;
  @Column(nullable = false) private Integer tier2DurationDays;

  @Column(nullable = false) private Integer tier1MajorToTier2;
  @Column(nullable = false) private Integer tier2NoResponseCount;
  @Column(nullable = false) private Integer tier2MajorToTier3;

  @Column(nullable = false) private Boolean requireParentContact;
  @Column(nullable = false) private Boolean requireAdminApproval;
  @Column(nullable = false) private String  notifyRoles;

  @Column(nullable = false) private Integer decayCount;
  @Column(nullable = false) private Integer decayDays;

  @Column(nullable = false, updatable = false) private OffsetDateTime createdAt = OffsetDateTime.now();
  @Column(nullable = false) private OffsetDateTime updatedAt = OffsetDateTime.now();


  @PreUpdate void onUpdate(){ this.updatedAt = OffsetDateTime.now(); }

  public Long getId(){ return id; }
  public District getDistrict(){ return district; }
  public void setDistrict(District d){ this.district = d; }
  public School getSchool(){ return school; }
  public void setSchool(School s){ this.school = s; }

  public Integer getTier1WindowDays(){ return tier1WindowDays; }
  public void setTier1WindowDays(Integer v){ this.tier1WindowDays = v; }
  public Integer getReviewEveryDays(){ return reviewEveryDays; }
  public void setReviewEveryDays(Integer v){ this.reviewEveryDays = v; }

  public Integer getSameCautionDetentionThreshold(){ return sameCautionDetentionThreshold; }
  public void setSameCautionDetentionThreshold(Integer v){ this.sameCautionDetentionThreshold = v; }
  public Integer getMixedCautionDetentionThreshold(){ return mixedCautionDetentionThreshold; }
  public void setMixedCautionDetentionThreshold(Integer v){ this.mixedCautionDetentionThreshold = v; }
  public Integer getSameCautionTier2Threshold(){ return sameCautionTier2Threshold; }
  public void setSameCautionTier2Threshold(Integer v){ this.sameCautionTier2Threshold = v; }

  public String getDetentionLabel(){ return detentionLabel; }
  public void setDetentionLabel(String v){ this.detentionLabel = v; }
  public Integer getDetentionDurationDays(){ return detentionDurationDays; }
  public void setDetentionDurationDays(Integer v){ this.detentionDurationDays = v; }
  public String getTier2Label(){ return tier2Label; }
  public void setTier2Label(String v){ this.tier2Label = v; }
  public Integer getTier2DurationDays(){ return tier2DurationDays; }
  public void setTier2DurationDays(Integer v){ this.tier2DurationDays = v; }

  public Integer getTier1MajorToTier2(){ return tier1MajorToTier2; }
  public void setTier1MajorToTier2(Integer v){ this.tier1MajorToTier2 = v; }
  public Integer getTier2NoResponseCount(){ return tier2NoResponseCount; }
  public void setTier2NoResponseCount(Integer v){ this.tier2NoResponseCount = v; }
  public Integer getTier2MajorToTier3(){ return tier2MajorToTier3; }
  public void setTier2MajorToTier3(Integer v){ this.tier2MajorToTier3 = v; }

  public Boolean getRequireParentContact(){ return requireParentContact; }
  public void setRequireParentContact(Boolean v){ this.requireParentContact = v; }
  public Boolean getRequireAdminApproval(){ return requireAdminApproval; }
  public void setRequireAdminApproval(Boolean v){ this.requireAdminApproval = v; }
  public String getNotifyRoles(){ return notifyRoles; }
  public void setNotifyRoles(String v){ this.notifyRoles = v; }

  public Integer getDecayCount(){ return decayCount; }
  public void setDecayCount(Integer v){ this.decayCount = v; }
  public Integer getDecayDays(){ return decayDays; }
  public void setDecayDays(Integer v){ this.decayDays = v; }

  public void setId(Long id) {
    this.id = id;
  }

  public OffsetDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(OffsetDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(OffsetDateTime createdAt) {
    this.createdAt = createdAt;
  }


}
