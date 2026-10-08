package com.deployguard.mapper;

import com.deployguard.dto.response.ProjectResponse;
import com.deployguard.entity.Project;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ProjectMapper {

    private final UserMapper userMapper;

    public ProjectResponse toResponse(Project project, long totalTasks, long openRisks, long pendingDeployments) {
        if (project == null) return null;
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .key(project.getKey())
                .description(project.getDescription())
                .status(project.getStatus())
                .priority(project.getPriority())
                .startDate(project.getStartDate())
                .targetEndDate(project.getTargetEndDate())
                .actualEndDate(project.getActualEndDate())
                .archived(project.isArchived())
                .createdById(project.getCreatedBy() != null ? project.getCreatedBy().getId() : null)
                .createdByUsername(project.getCreatedBy() != null ? project.getCreatedBy().getUsername() : null)
                .createdByFullName(project.getCreatedBy() != null ? project.getCreatedBy().getFullName() : null)
                .members(project.getMembers() != null ?
                        project.getMembers().stream().map(userMapper::toProfileResponse).collect(Collectors.toList()) :
                        Collections.emptyList())
                .totalTasks(totalTasks)
                .openRisks(openRisks)
                .pendingDeployments(pendingDeployments)
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }

    public ProjectResponse toResponse(Project project) {
        return toResponse(project, 0, 0, 0);
    }
}
