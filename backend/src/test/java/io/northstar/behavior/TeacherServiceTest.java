package io.northstar.behavior;

import io.northstar.behavior.dto.TeacherDTO;
import io.northstar.behavior.model.Teacher;
import io.northstar.behavior.repository.TeacherRepository;
import io.northstar.behavior.service.TeacherServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class TeacherServiceTest {

    TeacherRepository repo;
    TeacherServiceImpl service;

    @BeforeEach
    void setUp() {
        repo = mock(TeacherRepository.class);
        service = new TeacherServiceImpl(repo);
        // set default password via reflection since @Value won't run here
        try {
            var f = TeacherServiceImpl.class.getDeclaredField("defaultTeacherPassword");
            f.setAccessible(true);
            f.set(service, "SetMeNow!2025");
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    void create_ok_generatesUsername_firstInitialLast() {
        // Given
        when(repo.existsByEmail("john.doe@school.org")).thenReturn(false);
        when(repo.existsByUsername("jdoe")).thenReturn(false);
        when(repo.save(any())).thenAnswer(inv -> {
            Teacher t = inv.getArgument(0);
            t.setId(1L);
            return t;
        });

        // When
        TeacherDTO in = new TeacherDTO(null, "John", "Doe", "john.doe@school.org", null);
        TeacherDTO out = service.create(in);

        // Then
        assertNotNull(out.id());
        assertEquals("John", out.firstName());
        assertEquals("Doe", out.lastName());
        assertEquals("john.doe@school.org", out.email());
        assertEquals("jdoe", out.username());

        // And the password is hashed (not empty)
        ArgumentCaptor<Teacher> cap = ArgumentCaptor.forClass(Teacher.class);
        verify(repo).save(cap.capture());
        assertNotNull(cap.getValue().getPasswordHash());
        assertTrue(cap.getValue().getPasswordHash().startsWith("$2a$") || cap.getValue().getPasswordHash().startsWith("$2b$"));
    }

    @Test
    void create_usernameCollision_usesFirstTwoLetters() {
        // Given: jdoe exists, but jadoe does not
        when(repo.existsByEmail("james.doe@school.org")).thenReturn(false);
        when(repo.existsByUsername("jdoe")).thenReturn(true);
        when(repo.existsByUsername("jadoe")).thenReturn(false);
        when(repo.save(any())).thenAnswer(inv -> { Teacher t = inv.getArgument(0); t.setId(2L); return t; });

        // When
        TeacherDTO out = service.create(new TeacherDTO(null, "James", "Doe", "james.doe@school.org", null));

        // Then
        assertEquals("jadoe", out.username());
    }

    @Test
    void create_usernameCollision_needsNumericSuffix() {
        // Given: jdoe exists, jadoe exists, jadoe1 exists; jadoe2 is free
        when(repo.existsByEmail("jane.doe@school.org")).thenReturn(false);
        when(repo.existsByUsername("jdoe")).thenReturn(true);
        when(repo.existsByUsername("jadoe")).thenReturn(true);
        when(repo.existsByUsername("jadoe1")).thenReturn(true);
        when(repo.existsByUsername("jadoe2")).thenReturn(false);

        when(repo.save(any())).thenAnswer(inv -> { Teacher t = inv.getArgument(0); t.setId(3L); return t; });

        TeacherDTO out = service.create(new TeacherDTO(null, "Jane", "Doe", "jane.doe@school.org", null));
        assertEquals("jadoe2", out.username());
    }

    @Test
    void create_normalizesDiacriticsAndPunctuation() {
        // e.g., José Núñez → jnunez
        when(repo.existsByEmail("jose.nunez@school.org")).thenReturn(false);
        when(repo.existsByUsername("jnunez")).thenReturn(false);
        when(repo.save(any())).thenAnswer(inv -> { Teacher t = inv.getArgument(0); t.setId(4L); return t; });

        TeacherDTO out = service.create(new TeacherDTO(null, "José", "Núñez", "jose.nunez@school.org", null));
        assertEquals("jnunez", out.username());
    }

    @Test
    void create_conflictOnEmail_throws409() {
        when(repo.existsByEmail("dup@school.org")).thenReturn(true);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                service.create(new TeacherDTO(null, "A", "B", "dup@school.org", null))
        );
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
    }

    @Test
    void update_allowsNameAndEmailChange_butPreventsEmailCollision() {
        // Given
        Teacher existing = new Teacher();
        existing.setId(10L);
        existing.setFirstName("John");
        existing.setLastName("Doe");
        existing.setEmail("john.doe@school.org");
        existing.setUsername("jdoe");
        existing.setPasswordHash("$2a$something");

        when(repo.findById(10L)).thenReturn(Optional.of(existing));
        when(repo.existsByEmail("johnny.doe@school.org")).thenReturn(false);

        TeacherDTO out = service.update(10L, new TeacherDTO(null, "Johnny", "Doe", "johnny.doe@school.org", null));
        assertEquals("Johnny", out.firstName());
        assertEquals("johnny.doe@school.org", out.email());
        // username unchanged by default
        assertEquals("jdoe", out.username());
    }

    @Test
    void update_emailCollision_throws409() {
        Teacher existing = new Teacher();
        existing.setId(11L);
        existing.setFirstName("John");
        existing.setLastName("Doe");
        existing.setEmail("john.doe@school.org");
        existing.setUsername("jdoe");
        existing.setPasswordHash("$2a$something");

        when(repo.findById(11L)).thenReturn(Optional.of(existing));
        when(repo.existsByEmail("taken@school.org")).thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                service.update(11L, new TeacherDTO(null, "John", "Doe", "taken@school.org", null))
        );
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
    }

    @Test
    void findAll_returnsList() {
        List<Teacher> db = new ArrayList<>();
        for (int i = 0; i < 3; i++) {
            Teacher t = new Teacher();
            t.setId((long) (i + 1));
            t.setFirstName("F" + i);
            t.setLastName("L" + i);
            t.setEmail("f" + i + ".l" + i + "@school.org");
            t.setUsername("fl" + i);
            t.setPasswordHash("hash");
            db.add(t);
        }
        when(repo.findAll()).thenReturn(db);

        var list = service.findAll();
        // beginner-style loop per your preference
        int count = 0;
        for (int i = 0; i < list.size(); i++) {
            assertNotNull(list.get(i).id());
            count++;
        }
        assertEquals(3, count);
    }

    @Test
    void findById_notFound_throws404() {
        when(repo.findById(999L)).thenReturn(Optional.empty());
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.findById(999L));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    void delete_notFound_throws404() {
        when(repo.existsById(321L)).thenReturn(false);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.delete(321L));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    void delete_ok_callsRepo() {
        when(repo.existsById(1L)).thenReturn(true);
        service.delete(1L);
        verify(repo).deleteById(1L);
    }
}

