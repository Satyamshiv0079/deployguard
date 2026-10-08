package com.deployguard.dto.request;

import com.deployguard.entity.enums.RiskSeverity;
import com.deployguard.entity.enums.RiskStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
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
public class RiskUpdateRequest {

    @Size(min = 3, max = 200, message = "Risk title must be between 3 and 200 characters")
    private String title;

    private String description;

    private UUID ownerId;

    private RiskSeverity severity;

    @Min(value = 1, message = "Probability must be between 1 and 5")
    @Max(value = 5, message = "Probability must be between 1 and 5")
    private Integer probability;

    @Min(value = 1, message = "Impact must be between 1 and 5")
    @Max(value = 5, message = "Impact must be between 1 and 5")
    private Integer impact;

    private String mitigationPlan;

    private RiskStatus status;

    private LocalDate dueDate;
}
