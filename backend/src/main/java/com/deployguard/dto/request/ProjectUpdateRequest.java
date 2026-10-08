package com.deployguard.dto.request;

import com.deployguard.entity.enums.Priority;
import com.deployguard.entity.enums.ProjectStatus;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectUpdateRequest {

    @Size(min = 3, max = 150, message = "Project name must be between 3 and 150 characters")
    private String name;

    private String description;

    private ProjectStatus status;

    private Priority priority;

    private LocalDate startDate;

    private LocalDate targetEndDate;

    private LocalDate actualEndDate;

    private Boolean archived;

    private Set<UUID> memberIds;
}
