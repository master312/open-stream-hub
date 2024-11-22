export interface IService {
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
}
