package com.deployguard.dto.request;

import com.deployguard.entity.enums.RiskSeverity;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskCreateRequest {

    @NotBlank(message = "Risk title is required")
    @Size(min = 3, max = 200, message = "Risk title must be between 3 and 200 characters")
    private String title;

    private String description;

    @NotNull(message = "Project ID is required")
    private UUID projectId;

    private UUID ownerId;

    private RiskSeverity severity;

    @Min(value = 1, message = "Probability must be between 1 and 5")
    @Max(value = 5, message = "Probability must be between 1 and 5")
    @Builder.Default
    private int probability = 3;

    @Min(value = 1, message = "Impact must be between 1 and 5")
    @Max(value = 5, message = "Impact must be between 1 and 5")
    @Builder.Default
    private int impact = 3;

    private String mitigationPlan;

    private LocalDate dueDate;
}
