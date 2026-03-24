export const MAX_BYTES = 6 * 1024 * 1024;
export const DEFAULT_REPLICATE_TRYON_MODEL =
  "cuuupid/idm-vton:906425dbca90663ff5427624839572cc56ea7d380343d13e2a4c4b09d3f0c30f";
export const INPAINT_SIZE = 1024;

export function serverPort() {
  return Number(process.env.VIRTUAL_TRY_ON_SERVER_PORT || 3847);
}
