export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateAllConfigurations } = await import("@/lib/startup-validation");
    await validateAllConfigurations();
  }
}
