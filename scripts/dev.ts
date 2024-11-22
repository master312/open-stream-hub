async function startProcess(
  command: string[],
  name: string,
): Promise<Deno.Process> {
  const process = new Deno.Command(command[0], {
    args: command.slice(1),
    stdout: "inherit",
    stderr: "inherit",
  }).spawn();

  console.log(`[${name}] Started`);
  return process;
}

async function main() {
  const processes: Deno.Process[] = [];

  try {
    // Start frontend
    processes.push(
      await startProcess(["deno", "task", "dev:frontend"], "Frontend"),
    );

    // Start backend
    processes.push(
      await startProcess(["deno", "task", "dev:backend"], "Backend"),
    );

    // Handle termination signals
    const cleanup = async () => {
      console.log("\nShutting down processes...");
      for (const process of processes) {
        try {
          process.kill("SIGTERM");
          await process.status;
        } catch (err) {
          console.error("Error killing process:", err);
        }
      }
      Deno.exit(0);
    };

    // Handle SIGINT (Ctrl+C)
    Deno.addSignalListener("SIGINT", cleanup);
    // Handle SIGTERM
    Deno.addSignalListener("SIGTERM", cleanup);

    // Wait for all processes to complete
    await Promise.all(processes.map((p) => p.status));
  } catch (error) {
    console.error("Error running dev servers:", error);
    // Ensure cleanup on error
    for (const process of processes) {
      try {
        process.kill("SIGTERM");
      } catch (_) {
        // Ignore errors during cleanup
      }
    }
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
