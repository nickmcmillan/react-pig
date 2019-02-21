export default function(containerWidth) {
  if (containerWidth <= 640) return 600
  if (containerWidth <= 1920) return 800
  return 1000
}