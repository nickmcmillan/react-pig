export default function(containerWidth) {
  if (containerWidth <= 640) return 500
  if (containerWidth <= 1920) return 600
  return 800
}