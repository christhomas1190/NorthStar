package io.northstar.behavior.service;

import io.northstar.behavior.model.Incident;
import io.northstar.behavior.model.Student;
import io.northstar.behavior.repository.IncidentRepository;
import io.northstar.behavior.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IncidentServiceImpl implements com.fasterxml.jackson.databind.util.Named {
    private final IncidentRepository incidents;
    private final StudentRepository students;

    public IncidentServiceImpl(IncidentRepository incidents, StudentRepository students) {
        this.incidents = incidents;
        this.students = students;
    }

    @Override
    public String getName() { return "IncidentService"; }

    @Transactional
    public Incident create(Incident inc) {
        Student s = students.findById(inc.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("Student not found: " + inc.getStudentId()));
        inc.setStudent(s);
        return incidents.save(inc);
    }
}
