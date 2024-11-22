import { MongoDbService } from "../service/MongoDbService.ts";
import { StreamsRepository } from "./StreamsRepository.ts";

export let streamsRepository: StreamsRepository;

export async function initRepositories(db: MongoDbService): Promise<void> {
  streamsRepository = new StreamsRepository(db);
  await Promise.all([
    // Add initialization if needed
  ]);
}
