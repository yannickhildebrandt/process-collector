import { prisma } from "./db";
import { validateProjectConfiguration } from "./validators/config-schema";

export async function validateAllConfigurations(): Promise<void> {
  try {
    const configurations = await prisma.projectConfiguration.findMany({
      include: { project: { select: { name: true } } },
    });

    let hasErrors = false;

    for (const config of configurations) {
      const result = validateProjectConfiguration({
        industryClassification: config.industryClassification,
        processCategories: config.processCategories,
        customTerminology: config.customTerminology,
        interviewTemplateRefs: config.interviewTemplateRefs,
      });

      if (!result.valid) {
        hasErrors = true;
        console.error(
          `[Startup Validation] Invalid configuration for project "${config.project.name}" (${config.projectId}):`
        );
        for (const error of result.errors) {
          console.error(`  - ${error.field}: ${error.message}`);
        }
      }
    }

    if (hasErrors) {
      console.warn(
        "[Startup Validation] Some project configurations are invalid. Affected projects may not function correctly."
      );
    } else if (configurations.length > 0) {
      console.log(
        `[Startup Validation] All ${configurations.length} project configuration(s) validated successfully.`
      );
    }
  } catch (error) {
    // Don't crash the app on validation failure - log and continue
    console.warn("[Startup Validation] Could not validate configurations:", error);
  }
}
