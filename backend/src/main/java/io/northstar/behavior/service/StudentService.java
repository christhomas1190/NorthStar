package io.northstar.behavior.service;

import java.time.LocalDate;

public interface StudentService {

        // Students
        Student create(String firstName, String lastName, String studentId, String grade);

        Student getById(long id);

        List<Student> list(int page, int size);

        List<Student> search(String query, int page, int size);

        Student update(long id, String firstName, String lastName, String grade);

        void delete(long id);
        Intervention assignIntervention(long studentId,
                                        String tier,
                                        String strategy,
                                        String assignedBy,
                                        LocalDate startDate,
                                        LocalDate endDate);

        List<Intervention> listInterventions(long studentId);
    }
