package com.deployguard.dto.request;

import com.deployguard.entity.enums.Priority;
import com.deployguard.entity.enums.TaskStatus;
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
public class TaskUpdateRequest {

    @Size(min = 3, max = 200, message = "Task title must be between 3 and 200 characters")
    private String title;

    private String description;

    private TaskStatus status;

    private Priority priority;

    private LocalDate dueDate;

    private UUID assigneeId;

    private String blockedReason;

    private Set<UUID> dependencyTaskIds;
}
