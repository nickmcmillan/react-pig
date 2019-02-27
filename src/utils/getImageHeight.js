export default function(containerWidth) {
  if (containerWidth <= 640) return 400
  if (containerWidth <= 1920) return 500
  return 700
}