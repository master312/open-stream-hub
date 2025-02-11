export class RelayStatusEvent {
  constructor(public streamId: string,
              public relayId: string,
              public optionalData: any | undefined = undefined) {
  }
}