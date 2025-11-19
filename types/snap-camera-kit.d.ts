declare module "@snap/camera-kit" {
  export interface CameraKitSource {
    play?: () => Promise<void>
    pause?: () => Promise<void>
    stop?: () => Promise<void>
    dispose?: () => void
    close?: () => void
  }

  export interface CameraKitSession {
    setSource: (source: CameraKitSource) => Promise<void>
    play?: () => Promise<void>
    pause?: () => Promise<void>
    stop?: () => Promise<void>
    dispose?: () => void
    destroy?: () => void
    setLens?: (lens: unknown) => Promise<void>
    applyLens?: (lens: unknown) => Promise<void>
  }

  export interface CameraKitLensRepository {
    loadLensGroups?: (groupIds: string[]) => Promise<unknown>
    loadLens?: (options: { lensId: string; groupId?: string }) => Promise<unknown>
    findLensById?: (lensId: string) => Promise<unknown>
  }

  export interface CameraKitInstance {
    createSession: (config: { liveRenderTarget: HTMLCanvasElement }) => Promise<CameraKitSession>
    lensRepository: CameraKitLensRepository
  }

  export function bootstrapCameraKit(config: { apiToken: string }): Promise<CameraKitInstance>

  export const createUserMediaSource:
    | ((config: { cameraType: "front" | "back" }) => Promise<CameraKitSource>)
    | undefined

  export const createMediaStreamSource:
    | ((stream: MediaStream) => Promise<CameraKitSource>)
    | undefined
}
