import maplibregl from 'maplibre-gl';

export function createPulsingDot(
  map: maplibregl.Map,
  size = 120,
  colorRgb = [239, 68, 68]
): { width: number; height: number; data: Uint8Array; onAdd: () => void; render: () => boolean } {
  let context: CanvasRenderingContext2D | null = null;

  return {
    width: size,
    height: size,
    data: new Uint8Array(size * size * 4),

    onAdd() {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      context = canvas.getContext('2d');
    },

    render() {
      if (!context) return false;
      const duration = 1600;
      const t = (performance.now() % duration) / duration;

      const radius = (size / 2) * 0.3;
      const outerRadius = (size / 2) * 0.75 * t + radius;

      context.clearRect(0, 0, size, size);

      // Outer ripple
      context.beginPath();
      context.arc(size / 2, size / 2, outerRadius, 0, Math.PI * 2);
      context.fillStyle = `rgba(${colorRgb[0]}, ${colorRgb[1]}, ${colorRgb[2]}, ${1 - t})`;
      context.fill();

      // Middle halo
      context.beginPath();
      context.arc(size / 2, size / 2, radius * 1.4, 0, Math.PI * 2);
      context.fillStyle = `rgba(${colorRgb[0]}, ${colorRgb[1]}, ${colorRgb[2]}, 0.5)`;
      context.fill();

      // Inner core
      context.beginPath();
      context.arc(size / 2, size / 2, radius * 0.8, 0, Math.PI * 2);
      context.fillStyle = `rgb(${colorRgb[0]}, ${colorRgb[1]}, ${colorRgb[2]})`;
      context.strokeStyle = '#ffffff';
      context.lineWidth = 2;
      context.fill();
      context.stroke();

      this.data = context.getImageData(0, 0, size, size).data as any;
      map.triggerRepaint();
      return true;
    }
  };
}
