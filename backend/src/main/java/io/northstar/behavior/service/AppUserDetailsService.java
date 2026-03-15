package io.northstar.behavior.service;

import io.northstar.behavior.repository.AdminRepository;
import io.northstar.behavior.repository.TeacherRepository;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AppUserDetailsService implements UserDetailsService {

    private final AdminRepository adminRepo;
    private final TeacherRepository teacherRepo;

    public AppUserDetailsService(AdminRepository adminRepo, TeacherRepository teacherRepo) {
        this.adminRepo = adminRepo;
        this.teacherRepo = teacherRepo;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        var admin = adminRepo.findByUserName(username);
        if (admin.isPresent()) {
            return User.withUsername(admin.get().getUserName())
                    .password(admin.get().getPasswordHash())
                    .roles("ADMIN")
                    .build();
        }

        var teacher = teacherRepo.findByUserName(username);
        if (teacher.isPresent()) {
            return User.withUsername(teacher.get().getUserName())
                    .password(teacher.get().getPasswordHash())
                    .roles("TEACHER")
                    .build();
        }

        throw new UsernameNotFoundException("User not found: " + username);
    }
}
