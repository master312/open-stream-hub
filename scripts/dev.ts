async function startProcess(command: string[], name: string, cwd: string): Promise<Deno.Process> {
  const process = new Deno.Command(command[0], {
    args: command.slice(1),
    stdout: "inherit",
    stderr: "inherit",
    cwd: cwd,
  }).spawn();

  console.log(`[${name}] Started`);
  return process;
}

async function main() {
  const runType = Deno.env.get("RUN_TYPE");
  console.log(`CONFIG RunningType: ${runType}`);

  const processes: Deno.Process[] = [];

  try {
    if (runType === "all" || runType === "front") {
      console.log("Starting frontend...");
      processes.push(await startProcess(["deno", "task", "dev"], "Frontend", "./frontend"));
    }

    if (runType === "all" || runType === "back") {
      console.log("Starting backend...");
      processes.push(await startProcess(["deno", "task", "dev"], "Backend", "./backend"));
    }

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
