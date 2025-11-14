// src/main/java/io/northstar/behavior/service/EscalationRulesServiceImpl.java
package io.northstar.behavior.service;

import io.northstar.behavior.dto.EscalationRulesDTO;
import io.northstar.behavior.model.District;
import io.northstar.behavior.model.School;
import io.northstar.behavior.model.EscalationRules;
import io.northstar.behavior.repository.DistrictRepository;
import io.northstar.behavior.repository.SchoolRepository;
import io.northstar.behavior.repository.EscalationRulesRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;

@Service
@Transactional
public class EscalationRulesServiceImpl implements EscalationRulesService {

  private final EscalationRulesRepository repo;
  private final DistrictRepository districtRepo;
  private final SchoolRepository schoolRepo;

  public EscalationRulesServiceImpl(
          EscalationRulesRepository repo,
          DistrictRepository districtRepo,
          SchoolRepository schoolRepo) {
    this.repo = repo;
    this.districtRepo = districtRepo;
    this.schoolRepo = schoolRepo;
  }

  private static EscalationRulesDTO defaults(Long districtId, Long schoolId) {
    return new EscalationRulesDTO(
            null, 14, 10, 4, 6, 8,
            "Saturday detention", 1,
            "Escalate to Tier 2", 10,
            1, 3, 2,
            true, false, "Admin,Counselor",
            1, 7,
            districtId, schoolId,
            null, null
    );
  }

  private static EscalationRulesDTO toDto(EscalationRules e) {
    return new EscalationRulesDTO(
            e.getId(),
            e.getTier1WindowDays(),
            e.getReviewEveryDays(),
            e.getSameCautionDetentionThreshold(),
            e.getMixedCautionDetentionThreshold(),
            e.getSameCautionTier2Threshold(),
            e.getDetentionLabel(),
            e.getDetentionDurationDays(),
            e.getTier2Label(),
            e.getTier2DurationDays(),
            e.getTier1MajorToTier2(),
            e.getTier2NoResponseCount(),
            e.getTier2MajorToTier3(),
            e.getRequireParentContact(),
            e.getRequireAdminApproval(),
            e.getNotifyRoles(),
            e.getDecayCount(),
            e.getDecayDays(),
            e.getDistrict().getDistrictId(),
            e.getSchool().getSchoolId(),
            e.getCreatedAt(),
            e.getUpdatedAt()
    );
  }

  private static void apply(EscalationRules e, EscalationRulesDTO d) {
    e.setTier1WindowDays(d.tier1WindowDays());
    e.setReviewEveryDays(d.reviewEveryDays());
    e.setSameCautionDetentionThreshold(d.sameCautionDetentionThreshold());
    e.setMixedCautionDetentionThreshold(d.mixedCautionDetentionThreshold());
    e.setSameCautionTier2Threshold(d.sameCautionTier2Threshold());
    e.setDetentionLabel(d.detentionLabel());
    e.setDetentionDurationDays(d.detentionDurationDays());
    e.setTier2Label(d.tier2Label());
    e.setTier2DurationDays(d.tier2DurationDays());
    e.setTier1MajorToTier2(d.tier1MajorToTier2());
    e.setTier2NoResponseCount(d.tier2NoResponseCount());
    e.setTier2MajorToTier3(d.tier2MajorToTier3());
    e.setRequireParentContact(d.requireParentContact());
    e.setRequireAdminApproval(d.requireAdminApproval());
    e.setNotifyRoles(d.notifyRoles());
    e.setDecayCount(d.decayCount());
    e.setDecayDays(d.decayDays());
    e.setUpdatedAt(OffsetDateTime.now());
  }

  @Override
  public EscalationRulesDTO getOrDefaults(Long districtId, Long schoolId) {
    return repo.findByDistrict_DistrictIdAndSchool_SchoolId(districtId, schoolId)
            .map(EscalationRulesServiceImpl::toDto)
            .orElseGet(() -> defaults(districtId, schoolId));
  }

  @Override
  public EscalationRulesDTO upsert(Long districtId, Long schoolId, EscalationRulesDTO body) {
    District d = districtRepo.findById(districtId)
            .orElseThrow(() -> new IllegalArgumentException("District not found"));
    School s = schoolRepo.findById(schoolId)
            .orElseThrow(() -> new IllegalArgumentException("School not found"));

    EscalationRules e = repo.findByDistrict_DistrictIdAndSchool_SchoolId(districtId, schoolId)
            .orElseGet(() -> {
              EscalationRules n = new EscalationRules();
              n.setDistrict(d);
              n.setSchool(s);
              n.setCreatedAt(OffsetDateTime.now());
              return n;
            });

    apply(e, body != null ? body : defaults(districtId, schoolId));
    EscalationRules saved = repo.save(e);
    return toDto(saved);
  }
}
