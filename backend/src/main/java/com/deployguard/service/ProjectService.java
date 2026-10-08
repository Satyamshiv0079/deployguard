package com.deployguard.service;

import com.deployguard.dto.request.ProjectCreateRequest;
import com.deployguard.dto.request.ProjectUpdateRequest;
import com.deployguard.dto.response.PagedResponse;
import com.deployguard.dto.response.ProjectResponse;
import com.deployguard.entity.enums.ProjectStatus;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ProjectService {
    ProjectResponse createProject(ProjectCreateRequest request);
    ProjectResponse updateProject(UUID id, ProjectUpdateRequest request);
    ProjectResponse getProjectById(UUID id);
    PagedResponse<ProjectResponse> getProjects(ProjectStatus status, Boolean archived, Pageable pageable);
    void archiveProject(UUID id);
    void deleteProject(UUID id);
}
