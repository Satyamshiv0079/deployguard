package com.deployguard.dto.request;

import com.deployguard.entity.enums.Priority;
import com.deployguard.entity.enums.ProjectStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
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
public class ProjectCreateRequest {

    @NotBlank(message = "Project name is required")
    @Size(min = 3, max = 150, message = "Project name must be between 3 and 150 characters")
    private String name;

    @NotBlank(message = "Project key is required")
    @Size(min = 2, max = 20, message = "Project key must be between 2 and 20 characters")
    @Pattern(regexp = "^[A-Z0-9_-]+$", message = "Project key must be uppercase alphanumeric (e.g., PRJ-01)")
    private String key;

    private String description;

    @Builder.Default
    private ProjectStatus status = ProjectStatus.PLANNED;

    @NotNull(message = "Priority is required")
    @Builder.Default
    private Priority priority = Priority.MEDIUM;

    private LocalDate startDate;

    private LocalDate targetEndDate;

    private Set<UUID> memberIds;
}
