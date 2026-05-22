import { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import { ImagePlus, RotateCcw } from 'lucide-react';

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', reject);
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

const getCroppedBlob = async (imageSrc, cropPixels) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;
  ctx.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    cropPixels.width,
    cropPixels.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
  });
};

const AvatarCropper = ({ imageSrc, onImageSelected, onCropped, onClear }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropPixels, setCropPixels] = useState(null);

  const handleCropComplete = useCallback((_area, pixels) => {
    setCropPixels(pixels);
  }, []);

  const applyCrop = async () => {
    if (!imageSrc || !cropPixels) {
      return;
    }

    const blob = await getCroppedBlob(imageSrc, cropPixels);
    if (blob) {
      onCropped(blob);
    }
  };

  return (
    <div className="space-y-3">
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
        <ImagePlus className="h-4 w-4" />
        Choose DP
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              onImageSelected(file);
            }
          }}
        />
      </label>

      {imageSrc && (
        <div className="rounded-xl border border-slate-200 bg-slate-100 p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="relative h-56 overflow-hidden rounded-lg bg-slate-950">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="min-w-40 flex-1 accent-cyan-500"
              aria-label="Avatar zoom"
            />
            <button
              type="button"
              onClick={() => {
                setCrop({ x: 0, y: 0 });
                setZoom(1);
              }}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-200 px-3 text-sm font-semibold dark:border-slate-700"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
            <button
              type="button"
              onClick={applyCrop}
              className="h-9 rounded-full bg-cyan-500 px-4 text-sm font-bold text-slate-950"
            >
              Apply crop
            </button>
            <button type="button" onClick={onClear} className="h-9 rounded-full px-3 text-sm font-semibold text-slate-500">
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarCropper;
