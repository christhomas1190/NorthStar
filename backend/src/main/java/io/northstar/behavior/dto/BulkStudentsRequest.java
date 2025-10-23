package io.northstar.behavior.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class BulkStudentsRequest {
    @NotEmpty
     List students;

    public BulkStudentsRequest() {}

    public BulkStudentsRequest(java.util.List<CreateStudentRequest> students) {
        this.students = students;
    }

    public java.util.List<CreateStudentRequest> getStudents() { return students; }
    public void setStudents(java.util.List<CreateStudentRequest> students) { this.students = new java.util.ArrayList<>(students); }
}
