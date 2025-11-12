package io.northstar.behavior.service;

import io.northstar.behavior.dto.EscalationRulesDTO;
import io.northstar.behavior.model.District;
import io.northstar.behavior.model.EscalationRules;
import io.northstar.behavior.model.School;
import io.northstar.behavior.repository.DistrictRepository;
import io.northstar.behavior.repository.EscalationRulesRepository;
import io.northstar.behavior.repository.SchoolRepository;
import io.northstar.behavior.tenant.TenantContext;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;

@Service
@Transactional
public class EscalationRulesServiceImpl implements EscalationRulesService {

  private final EscalationRulesRepository repo;
  private final DistrictRepository districtRepo;
  private final SchoolRepository schoolRepo;

  public EscalationRulesServiceImpl(EscalationRulesRepository repo, DistrictRepository districtRepo, SchoolRepository schoolRepo) {
    this.repo = repo;
    this.districtRepo = districtRepo;
    this.schoolRepo = schoolRepo;
  }

  private static EscalationRulesDTO defaults() {
    return new EscalationRulesDTO(
      14, 10, 4, 6, 8,
      "Saturday detention", 1,
      "Escalate to Tier 2", 10,
      1, 3, 2,
      true, false, "Admin,Counselor",
      1, 7
    );
  }

  private EscalationRulesDTO toDto(EscalationRules e) {
    return new EscalationRulesDTO(
      e.getTier1WindowDays(), e.getReviewEveryDays(),
      e.getSameCautionDetentionThreshold(), e.getMixedCautionDetentionThreshold(), e.getSameCautionTier2Threshold(),
      e.getDetentionLabel(), e.getDetentionDurationDays(),
      e.getTier2Label(), e.getTier2DurationDays(),
      e.getTier1MajorToTier2(), e.getTier2NoResponseCount(), e.getTier2MajorToTier3(),
      e.getRequireParentContact(), e.getRequireAdminApproval(), e.getNotifyRoles(),
      e.getDecayCount(), e.getDecayDays()
    );
  }
  public EscalationRulesDTO create(Long schoolId, EscalationRulesDTO dto) {
    Long districtId = TenantContext.getDistrictId();
    if (districtId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);

    EscalationRules e = new EscalationRules();
    apply(e, dto);
    e.setDistrict(districtRepo.getReferenceById(districtId));
    e.setSchool(schoolRepo.getReferenceById(schoolId));
    e.setCreatedAt(OffsetDateTime.now());
    e.setUpdatedAt(OffsetDateTime.now());
    return toDto(repo.save(e));
  }

  private void apply(EscalationRules e, EscalationRulesDTO d) {
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
    e.setRequireParentContact(Boolean.TRUE.equals(d.requireParentContact()));
    e.setRequireAdminApproval(Boolean.TRUE.equals(d.requireAdminApproval()));
    e.setNotifyRoles(d.notifyRoles());
    e.setDecayCount(d.decayCount());
    e.setDecayDays(d.decayDays());
  }

  @Override
  public EscalationRulesDTO get() {
    Long districtId = TenantContext.getDistrictId();
    if (districtId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No district in context");
    Long schoolId = TenantContext.getSchoolId().orElse(null);

    return repo.findByDistrict_DistrictIdAndSchool_SchoolId(districtId, schoolId == null ? -1L : schoolId)
      .or(() -> repo.findByDistrict_DistrictIdAndSchoolIsNull(districtId))
      .map(this::toDto)
      .orElse(defaults());
  }

  @Override
  public EscalationRulesDTO upsert(EscalationRulesDTO dto) {
    Long districtId = TenantContext.getDistrictId();
    if (districtId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No district in context");
    Long schoolId = TenantContext.getSchoolId().orElse(null);

    EscalationRules entity = null;
    if (schoolId != null) {
      entity = repo.findByDistrict_DistrictIdAndSchool_SchoolId(districtId, schoolId).orElse(null);
    }
    if (entity == null) {
      entity = repo.findByDistrict_DistrictIdAndSchoolIsNull(districtId).orElse(null);
    }
    if (entity == null) {
      entity = new EscalationRules();
      District d = districtRepo.getReferenceById(districtId);
      entity.setDistrict(d);
      if (schoolId != null) {
        School s = schoolRepo.getReferenceById(schoolId);
        entity.setSchool(s);
      }
    }

    apply(entity, dto);
    EscalationRules saved = repo.save(entity);
    return toDto(saved);
  }
}
