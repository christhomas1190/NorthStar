package io.northstar.behavior.service;

import io.northstar.behavior.model.Incident;
import org.springframework.stereotype.Service;

@Service
public interface IncidentService {
    Incident create(Incident inc);
}
