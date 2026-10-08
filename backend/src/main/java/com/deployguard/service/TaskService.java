package com.deployguard.service;

import com.deployguard.dto.request.TaskCreateRequest;
import com.deployguard.dto.request.TaskUpdateRequest;
import com.deployguard.dto.response.PagedResponse;
import com.deployguard.dto.response.TaskResponse;
import com.deployguard.entity.enums.TaskStatus;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface TaskService {
    TaskResponse createTask(TaskCreateRequest request);
    TaskResponse updateTask(UUID id, TaskUpdateRequest request);
    TaskResponse getTaskById(UUID id);
    PagedResponse<TaskResponse> getTasks(UUID projectId, UUID assigneeId, TaskStatus status, Boolean overdue, Pageable pageable);
    List<TaskResponse> getTasksByProject(UUID projectId);
    void deleteTask(UUID id);
}
