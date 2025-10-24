package io.northstar.behavior.service;

import io.northstar.behavior.model.Student;
import io.northstar.behavior.repository.StudentRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StudentServiceImpl implements StudentService {

    private final StudentRepository repo;

    public StudentServiceImpl(StudentRepository repo) {
        this.repo = repo;
    }

    @Override
    public Student create(String firstName, String lastName, String studentId, String grade) {
        Student s = new Student();
        s.setFirstName(firstName);
        s.setLastName(lastName);
        s.setStudentId(studentId);
        s.setGrade(grade);
        return repo.save(s);
    }

    @Override
    public List<Student> findAll() {
        return repo.findAll();
    }

    @Override
    public Student findById(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Student %d not found".formatted(id)));
    }

    @Override
    public void delete(Long id) {
        repo.deleteById(id);
    }

    @Override
    public List<Student> list(int page, int size) {
        // basic pageable list
        return repo.findAll(PageRequest.of(page, size)).getContent();
    }

    @Override
    public List<Student> search(String q, int page, int size) {
        // very simple “contains” search across first/last/studentId
        return repo
                .findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCaseOrStudentIdContainingIgnoreCase(
                        q, q, q, PageRequest.of(page, size))
                .getContent();
    }

}
