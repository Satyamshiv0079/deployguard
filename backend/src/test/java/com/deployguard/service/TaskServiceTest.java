package com.deployguard.service;

import com.deployguard.audit.AuditService;
import com.deployguard.dto.request.TaskUpdateRequest;
import com.deployguard.entity.Project;
import com.deployguard.entity.Task;
import com.deployguard.exception.BadRequestException;
import com.deployguard.mapper.TaskMapper;
import com.deployguard.repository.ProjectRepository;
import com.deployguard.repository.TaskRepository;
import com.deployguard.repository.UserRepository;
import com.deployguard.service.impl.TaskServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TaskMapper taskMapper;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private TaskServiceImpl taskService;

    private Project mockProject;
    private Task taskA;
    private Task taskB;

    @BeforeEach
    void setUp() {
        mockProject = Project.builder().id(UUID.randomUUID()).name("Fintech Core").build();

        taskA = Task.builder()
                .id(UUID.randomUUID())
                .title("Task A")
                .project(mockProject)
                .build();

        taskB = Task.builder()
                .id(UUID.randomUUID())
                .title("Task B")
                .project(mockProject)
                .dependencies(Set.of(taskA))
                .build();
    }

    @Test
    @DisplayName("Should throw BadRequestException if task attempts to depend on itself")
    void shouldRejectSelfDependency() {
        UUID taskId = taskA.getId();
        TaskUpdateRequest request = TaskUpdateRequest.builder()
                .dependencyTaskIds(Set.of(taskId))
                .build();

        when(taskRepository.findWithDetailsById(taskId)).thenReturn(Optional.of(taskA));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> taskService.updateTask(taskId, request));
        assertTrue(ex.getMessage().contains("Task cannot depend on itself"));
    }

    @Test
    @DisplayName("Should throw BadRequestException if direct circular dependency is introduced")
    void shouldRejectCircularDependency() {
        UUID taskAId = taskA.getId();
        UUID taskBId = taskB.getId();

        TaskUpdateRequest request = TaskUpdateRequest.builder()
                .dependencyTaskIds(Set.of(taskBId))
                .build();

        when(taskRepository.findWithDetailsById(taskAId)).thenReturn(Optional.of(taskA));
        when(taskRepository.findById(taskBId)).thenReturn(Optional.of(taskB));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> taskService.updateTask(taskAId, request));
        assertTrue(ex.getMessage().contains("Circular dependency detected"));
    }
}
