package io.northstar.behavior.controller;

import io.northstar.behavior.dto.TierChangeEventDTO;
import io.northstar.behavior.model.TierChangeEvent;
import io.northstar.behavior.repository.AdminRepository;
import io.northstar.behavior.repository.TierChangeEventRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
public class TierChangeEventController {

    private final TierChangeEventRepository repo;
    private final AdminRepository admins;

    public TierChangeEventController(TierChangeEventRepository repo, AdminRepository admins) {
        this.repo = repo;
        this.admins = admins;
    }

    private TierChangeEventDTO toDto(TierChangeEvent e) {
        String studentName = null;
        Long studentId = null;
        if (e.getStudent() != null) {
            studentId = e.getStudent().getId();
            String first = e.getStudent().getFirstName();
            String last = e.getStudent().getLastName();
            studentName = ((first != null) ? first : "") + ((last != null) ? " " + last : "");
            studentName = studentName.trim();
        }
        return new TierChangeEventDTO(
                e.getId(),
                studentId,
                studentName,
                e.getFromTier(),
                e.getToTier(),
                e.getChangedAt(),
                e.getChangedBy()
        );
    }

    @GetMapping("/api/students/{studentId}/tier-history")
    public List<TierChangeEventDTO> forStudent(@PathVariable Long studentId) {
        return repo.findByStudent_IdOrderByChangedAtDesc(studentId)
                .stream().map(this::toDto).toList();
    }

    @GetMapping("/api/tier-history")
    public List<TierChangeEventDTO> forDistrict() {
        String userName = SecurityContextHolder.getContext().getAuthentication().getName();
        var admin = admins.findByUserName(userName)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "admin not found"));
        Long districtId = admin.getDistrict().getDistrictId();
        return repo.findByDistrict_DistrictIdOrderByChangedAtDesc(districtId)
                .stream().map(this::toDto).toList();
    }
}
