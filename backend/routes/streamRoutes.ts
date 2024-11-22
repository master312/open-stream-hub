import { Router } from "npm:express";
import type { Request, Response } from "npm:express";
import { streamCrudService, streamMgrService } from "../service/index.ts";
import { CreateStreamRequest } from "../../common/dto.ts";
import { config } from "../config.ts";

export function createStreamRoutes(router: Router) {
  router
    .get("/api/pub_injest_url", async (_req: Request, res: Response) => {
      try {
        res.json({
          url:
            config.injestRtmpServer.publicUrl +
            "/" +
            config.injestRtmpServer.linkRoot,
        });
      } catch (error) {
        console.error("Error fetching public ingest url:", error);
        res.status(500).json({ error: "Failed to fetch public ingest url" });
      }
    })

    .get("/api/streams", async (_req: Request, res: Response) => {
      try {
        const streams = await streamCrudService.getAllStreams();
        res.json(streams);
      } catch (error) {
        console.error("Error fetching streams:", error);
        res.status(500).json({ error: "Failed to fetch streams" });
      }
    })

    .get("/api/streams/:id", async (req: Request, res: Response) => {
      try {
        const stream = await streamCrudService.getStream(req.params.id);
        if (stream) {
          res.json(stream);
        } else {
          res.status(404).json({ error: "Stream not found" });
        }
      } catch (error) {
        console.error("Error fetching stream:", error);
        res.status(500).json({ error: "Failed to fetch stream" });
      }
    })

    .post("/api/streams", async (req: Request, res: Response) => {
      try {
        const { name } = req.body as CreateStreamRequest;
        if (!name) {
          res
            .status(400)
            .json({ error: "Invalid request. 'name' is required." });
          return;
        }

        const stream = await streamCrudService.createStream({
          name,
          destinations: [],
        });
        res.status(201).json(stream);
      } catch (error) {
        console.error("Error creating stream:", error);
        res.status(500).json({ error: "Failed to create stream" });
      }
    })

    .post("/api/streams/:id/start", async (req: Request, res: Response) => {
      try {
        await streamMgrService.startStream(req.params.id);
        const stream = await streamCrudService.getStream(req.params.id);
        res.json(stream);
      } catch (error) {
        console.error("Error starting stream:", error);
        res.status(500).json({ error: "Failed to start stream" });
      }
    })

    .post("/api/streams/:id/stop", async (req: Request, res: Response) => {
      try {
        await streamMgrService.stopStream(req.params.id);
        const stream = await streamCrudService.getStream(req.params.id);
        res.json(stream);
      } catch (error) {
        console.error("Error stopping stream:", error);
        res.status(500).json({ error: "Failed to stop stream" });
      }
    })

    .delete("/api/streams/:id", async (req: Request, res: Response) => {
      try {
        const wasDeleted = await streamCrudService.deleteStream(req.params.id);
        if (wasDeleted) {
          res.status(204).send();
        } else {
          res.status(404).json({ error: "Stream not found" });
        }
      } catch (error) {
        console.error("Error deleting stream:", error);
        res.status(500).json({ error: "Failed to delete stream" });
      }
    })

    .post(
      "/api/streams/:id/destinations",
      async (req: Request, res: Response) => {
        try {
          const stream = await streamCrudService.addDestination(
            req.params.id,
            req.body,
          );
          res.json(stream);
        } catch (error) {
          console.error("Error adding destination:", error);
          if (error.message.includes("not found")) {
            res.status(404).json({ error: error.message });
          } else {
            res.status(400).json({ error: "Invalid destination data" });
          }
        }
      },
    )

    .delete(
      "/api/streams/:id/destinations/:destinationId",
      async (req: Request, res: Response) => {
        try {
          const stream = await streamCrudService.removeDestination(
            req.params.id,
            req.params.destinationId,
          );
          res.json(stream);
        } catch (error) {
          console.error("Error removing destination:", error);
          if (error.message.includes("not found")) {
            res.status(404).json({ error: error.message });
          } else {
            res.status(400).json({ error: "Failed to remove destination" });
          }
        }
      },
    );

  return router;
}
