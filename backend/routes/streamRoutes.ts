import { Router } from "npm:express";
import type { Request, Response } from "npm:express";
import { StreamManager } from "../services/StreamManager.ts";
import { CreateStreamRequest } from "../../common/types.ts";

export function createStreamRoutes(
  router: Router,
  streamManager: StreamManager,
) {
  router
    .get("/api/streams", async (_req: Request, res: Response) => {
      const streams = await streamManager.getAllStreams();
      res.json(streams);
    })

    .get("/api/streams/:id", async (req: Request, res: Response) => {
      const id = req.params.id;
      const stream = await streamManager.getStream(id);
      if (stream) {
        res.json(stream);
      } else {
        res.status(404).json({ error: "Stream not found" });
      }
    })

    .get("/api/streams/:id/thumbnail", async (req: Request, res: Response) => {
      const id = req.params.id;

      try {
        // Get the stream to verify it exists
        const stream = await streamManager.getStream(id);
        if (!stream) {
          res.status(404).json({ error: "Stream not found" });
          return;
        }

        const thumbnail = await streamManager.thumbnailService.getThumbnail(id);

        if (!thumbnail) {
          res.status(404).json({ error: "Thumbnail not available" });
          return;
        }

        // Set appropriate headers
        res.setHeader("Content-Type", thumbnail.contentType);
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Content-Length", thumbnail.data.length.toString());
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");

        // Send the thumbnail
        res.send(thumbnail.data);
      } catch (error) {
        console.error(
          `Error processing thumbnail request for stream ${id}:`,
          error,
        );
        res.status(500).json({ error: "Internal server error" });
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

        const stream = await streamManager.createStream(name);
        res.status(201).json(stream);
      } catch (error) {
        console.error("Error creating stream:", error);
        res.status(500).json({ error: "Failed to create stream" });
      }
    })

    .post("/api/streams/:id/start", async (req: Request, res: Response) => {
      const id = req.params.id;
      const stream = await streamManager.startStream(id);
      if (stream) {
        res.json(stream);
      } else {
        res.status(404).json({ error: "Stream not found" });
      }
    })

    .post("/api/streams/:id/stop", async (req: Request, res: Response) => {
      const id = req.params.id;
      const stream = await streamManager.stopStream(id);
      if (stream) {
        res.json(stream);
      } else {
        res.status(404).json({ error: "Stream not found" });
      }
    })

    .delete("/api/streams/:id", async (req: Request, res: Response) => {
      const id = req.params.id;
      try {
        var wasDeleted = await streamManager.deleteStream(id);
        if (wasDeleted) {
          res.status(204).send();
        } else {
          res.status(404).json({ error: "Stream not found" });
        }
      } catch (error) {
        res.status(404).json({ error: "Stream not found" });
      }
    })

    .post(
      "/api/streams/:id/destinations",
      async (req: Request, res: Response) => {
        const id = req.params.id;
        try {
          const destination = req.body;
          const stream = await streamManager.addDestination(id, destination);
          if (stream) {
            res.json(stream);
          } else {
            res.status(404).json({ error: "Stream not found" });
          }
        } catch (error) {
          res.status(400).json({ error: "Invalid destination data" });
        }
      },
    )

    .delete(
      "/api/streams/:id/destinations/:destinationId",
      async (req: Request, res: Response) => {
        const { id, destinationId } = req.params;
        try {
          const stream = await streamManager.removeDestination(
            id,
            destinationId,
          );
          if (stream) {
            res.json(stream);
          } else {
            res.status(404).json({ error: "Stream or destination not found" });
          }
        } catch (error) {
          res.status(400).json({ error: "Failed to remove destination" });
        }
      },
    );

  return router;
}
