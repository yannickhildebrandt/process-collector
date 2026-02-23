export interface ProcessCategory {
  key: string;
  labelDe: string;
  labelEn: string;
}

export interface IndustryClassification {
  sector: string;
  subSector?: string;
}

export interface CustomTerminology {
  [term: string]: {
    de: string;
    en: string;
  };
}

export interface ProjectConfigurationData {
  industryClassification: IndustryClassification;
  processCategories: ProcessCategory[];
  customTerminology?: CustomTerminology | null;
  interviewTemplateRefs?: string[] | null;
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validateProjectConfiguration(
  data: unknown
): { valid: true; data: ProjectConfigurationData } | { valid: false; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: [{ field: "root", message: "Configuration must be an object" }] };
  }

  const config = data as Record<string, unknown>;

  // Validate industryClassification
  if (!config.industryClassification || typeof config.industryClassification !== "object") {
    errors.push({
      field: "industryClassification",
      message: "Industry classification is required and must be an object",
    });
  } else {
    const ic = config.industryClassification as Record<string, unknown>;
    if (!ic.sector || typeof ic.sector !== "string" || ic.sector.trim() === "") {
      errors.push({
        field: "industryClassification.sector",
        message: "Sector is required and must be a non-empty string",
      });
    }
    if (ic.subSector !== undefined && typeof ic.subSector !== "string") {
      errors.push({
        field: "industryClassification.subSector",
        message: "Sub-sector must be a string if provided",
      });
    }
  }

  // Validate processCategories
  if (!Array.isArray(config.processCategories)) {
    errors.push({
      field: "processCategories",
      message: "Process categories must be an array",
    });
  } else if (config.processCategories.length === 0) {
    errors.push({
      field: "processCategories",
      message: "At least one process category is required",
    });
  } else {
    (config.processCategories as unknown[]).forEach((cat, index) => {
      if (!cat || typeof cat !== "object") {
        errors.push({
          field: `processCategories[${index}]`,
          message: `Category at index ${index} must be an object`,
        });
        return;
      }
      const c = cat as Record<string, unknown>;
      if (!c.key || typeof c.key !== "string" || c.key.trim() === "") {
        errors.push({
          field: `processCategories[${index}].key`,
          message: `Category at index ${index} requires a non-empty key`,
        });
      }
      if (!c.labelDe || typeof c.labelDe !== "string") {
        errors.push({
          field: `processCategories[${index}].labelDe`,
          message: `Category at index ${index} requires a German label (labelDe)`,
        });
      }
      if (!c.labelEn || typeof c.labelEn !== "string") {
        errors.push({
          field: `processCategories[${index}].labelEn`,
          message: `Category at index ${index} requires an English label (labelEn)`,
        });
      }
    });
  }

  // Validate customTerminology (optional)
  if (config.customTerminology !== undefined && config.customTerminology !== null) {
    if (typeof config.customTerminology !== "object" || Array.isArray(config.customTerminology)) {
      errors.push({
        field: "customTerminology",
        message: "Custom terminology must be an object if provided",
      });
    } else {
      const terms = config.customTerminology as Record<string, unknown>;
      for (const [term, value] of Object.entries(terms)) {
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          errors.push({
            field: `customTerminology.${term}`,
            message: `Terminology entry "${term}" must be an object with de and en keys`,
          });
          continue;
        }
        const v = value as Record<string, unknown>;
        if (typeof v.de !== "string" || typeof v.en !== "string") {
          errors.push({
            field: `customTerminology.${term}`,
            message: `Terminology entry "${term}" must have both de and en string values`,
          });
        }
      }
    }
  }

  // Validate interviewTemplateRefs (optional)
  if (config.interviewTemplateRefs !== undefined && config.interviewTemplateRefs !== null) {
    if (!Array.isArray(config.interviewTemplateRefs)) {
      errors.push({
        field: "interviewTemplateRefs",
        message: "Interview template references must be an array if provided",
      });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: config as unknown as ProjectConfigurationData,
  };
}
