export interface FocalPoint {
  x: number;
  y: number;
}

export interface ImageBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

function clampNormalized(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function normalizeFocalPoint(
  focalPoint?: FocalPoint | null
): FocalPoint {
  if (
    !focalPoint ||
    !Number.isFinite(focalPoint.x) ||
    !Number.isFinite(focalPoint.y)
  ) {
    return { x: 0.5, y: 0.5 };
  }

  return {
    x: clampNormalized(focalPoint.x),
    y: clampNormalized(focalPoint.y),
  };
}

export function focalPointToObjectPosition(
  focalPoint?: FocalPoint | null
): string {
  const normalized = normalizeFocalPoint(focalPoint);
  return `${normalized.x * 100}% ${normalized.y * 100}%`;
}

export function getContainedImageBounds(
  imageWidth: number,
  imageHeight: number,
  containerWidth: number,
  containerHeight: number
): ImageBounds {
  if (
    imageWidth <= 0 ||
    imageHeight <= 0 ||
    containerWidth <= 0 ||
    containerHeight <= 0
  ) {
    return { left: 0, top: 0, width: containerWidth, height: containerHeight };
  }

  const scale = Math.min(
    containerWidth / imageWidth,
    containerHeight / imageHeight
  );
  const width = imageWidth * scale;
  const height = imageHeight * scale;

  return {
    left: (containerWidth - width) / 2,
    top: (containerHeight - height) / 2,
    width,
    height,
  };
}

export function getCoverImageBounds(
  imageWidth: number,
  imageHeight: number,
  containerWidth: number,
  containerHeight: number,
  focalPoint?: FocalPoint | null
): ImageBounds {
  if (
    imageWidth <= 0 ||
    imageHeight <= 0 ||
    containerWidth <= 0 ||
    containerHeight <= 0
  ) {
    return { left: 0, top: 0, width: containerWidth, height: containerHeight };
  }

  const normalized = normalizeFocalPoint(focalPoint);
  const scale = Math.max(
    containerWidth / imageWidth,
    containerHeight / imageHeight
  );
  const width = imageWidth * scale;
  const height = imageHeight * scale;

  return {
    left: Math.max(
      containerWidth - width,
      Math.min(0, containerWidth / 2 - normalized.x * width)
    ),
    top: Math.max(
      containerHeight - height,
      Math.min(0, containerHeight / 2 - normalized.y * height)
    ),
    width,
    height,
  };
}

export function focalPointFromTouch(
  x: number,
  y: number,
  imageBounds: ImageBounds
): FocalPoint {
  if (imageBounds.width <= 0 || imageBounds.height <= 0) {
    return { x: 0.5, y: 0.5 };
  }

  return {
    x: clampNormalized((x - imageBounds.left) / imageBounds.width),
    y: clampNormalized((y - imageBounds.top) / imageBounds.height),
  };
}
