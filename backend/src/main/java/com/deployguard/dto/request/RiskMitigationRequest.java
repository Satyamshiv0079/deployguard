package com.deployguard.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskMitigationRequest {

    @NotBlank(message = "Action title is required")
    @Size(min = 3, max = 200, message = "Action title must be between 3 and 200 characters")
    private String actionTitle;

    private String actionDescription;

    private UUID ownerId;

    private Boolean completed;
}
