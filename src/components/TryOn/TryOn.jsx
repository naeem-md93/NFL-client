import React, { useRef, useState, useEffect } from "react";

/**
 * TryOnComponent
 * Props:
 *  - selectedOutfit: optional initial outfit overlay (not required)
 *
 * Notes:
 *  - Overlays are stored as { id, src, x, y, w, h } where x,y,w,h are percentages (0..1)
 *  - x,y are top-left relative to displayed image box
 */
export default function TryOnComponent({ selectedOutfit = null }) {
  const fileInputRef = useRef(null);
  const imgRef = useRef(null);
  const stageRef = useRef(null);

  const [userImageUrl, setUserImageUrl] = useState("");
  const [userImageNaturalSize, setUserImageNaturalSize] = useState({ w: 0, h: 0 });
  const [overlays, setOverlays] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState("idle"); // 'dragging' | 'resizing' | 'idle'
  const dragState = useRef(null); // ephemeral drag info

  // Sample recommended items (you can swap these for dynamic data)
  const recs = [
    {
      id: "rec1",
      title: "Blue Denim Jacket",
      category: "Outerwear",
      src: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea",
    },
    {
      id: "rec2",
      title: "Black T-Shirt",
      category: "Top",
      src: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8",
    },
    {
      id: "rec3",
      title: "White Sneakers",
      category: "Shoes",
      src: "https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec",
    },
    {
      id: "rec4",
      title: "White T-Shirt",
      category: "Top",
      src: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c",
    },
  ];

  // If user gave an initial selectedOutfit, add it once on mount
  useEffect(() => {
    if (selectedOutfit && selectedOutfit.src) {
      // place center with moderate size
      addOverlay(selectedOutfit.src, 0.3, 0.25, 0.4, 0.4);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helpers to compute displayed image rect inside stage
  function getImageDisplayRect() {
    if (!imgRef.current || !stageRef.current) return null;
    const stageRect = stageRef.current.getBoundingClientRect();
    const imgRect = imgRef.current.getBoundingClientRect();
    // We'll return rect relative to page, will be used in pointer calculations
    return { stageRect, imgRect };
  }

  // File selection handlers
  function onClickUpload() {
    fileInputRef.current?.click();
  }

  function onUserFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setUserImageUrl(url);

    // preload to get natural size
    const tmp = new Image();
    tmp.onload = () => {
      setUserImageNaturalSize({ w: tmp.naturalWidth, h: tmp.naturalHeight });
    };
    tmp.src = url;

    // Reset overlays selection
    setOverlays([]);
    setSelectedId(null);
  }

  function onClearPhoto() {
    setUserImageUrl("");
    setUserImageNaturalSize({ w: 0, h: 0 });
    setOverlays([]);
    setSelectedId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // Add a recommended overlay; default dims passed as percentages
  function addOverlay(src, x = 0.35, y = 0.1, w = 0.3, h = 0.3) {
    const id = `ov-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setOverlays((prev) => [...prev, { id, src, x, y, w, h }]);
    setSelectedId(id);
  }

  function clearOverlays() {
    setOverlays([]);
    setSelectedId(null);
  }

  // Pointer handlers for dragging overlays
  function onOverlayPointerDown(e, ov) {
    e.stopPropagation();
    const pr = getImageDisplayRect();
    if (!pr) return;

    // capture pointer so we continue receiving moves outside element
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const pointerX = e.clientX;
    const pointerY = e.clientY;

    dragState.current = {
      type: "dragging",
      id: ov.id,
      startPointer: { x: pointerX, y: pointerY },
      // compute offset inside overlay in page pixels
      startRect: target.getBoundingClientRect(),
      imgRect: pr.imgRect,
      shiftKey: e.shiftKey,
    };

    setMode("dragging");
    setSelectedId(ov.id);
  }

  function onHandlePointerDown(e, ov) {
    e.stopPropagation();
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const pr = getImageDisplayRect();
    if (!pr) return;

    const pointerX = e.clientX;
    const pointerY = e.clientY;

    dragState.current = {
      type: "resizing",
      id: ov.id,
      startPointer: { x: pointerX, y: pointerY },
      startRect: e.currentTarget.parentElement.getBoundingClientRect(), // the overlay element
      imgRect: pr.imgRect,
      lockProportions: e.shiftKey, // shift will lock aspect
    };

    setMode("resizing");
    setSelectedId(ov.id);
  }

  function onStagePointerMove(e) {
    if (!dragState.current) return;
    const state = dragState.current;
    const { imgRect } = state;
    const dx = e.clientX - state.startPointer.x;
    const dy = e.clientY - state.startPointer.y;

    // convert dx,dy (page pixels) to relative to displayed image size
    const imgW = imgRect.width;
    const imgH = imgRect.height;

    setOverlays((prev) =>
      prev.map((ov) => {
        if (ov.id !== state.id) return ov;
        if (state.type === "dragging") {
          // startRect -> overlay start bounding rect
          const newLeftPx = state.startRect.left + dx - imgRect.left;
          const newTopPx = state.startRect.top + dy - imgRect.top;
          let newX = newLeftPx / imgW;
          let newY = newTopPx / imgH;
          // clamp
          newX = Math.max(0, Math.min(1 - ov.w, newX));
          newY = Math.max(0, Math.min(1 - ov.h, newY));
          return { ...ov, x: newX, y: newY };
        } else if (state.type === "resizing") {
          // resizing from bottom-right handle only
          const startLeft = state.startRect.left - imgRect.left;
          const startTop = state.startRect.top - imgRect.top;
          const startW = state.startRect.width;
          const startH = state.startRect.height;

          // new widths in px
          let newWpx = Math.max(10, startW + dx);
          let newHpx = Math.max(10, startH + dy);

          if (state.lockProportions) {
            // keep aspect ratio of startW / startH
            const aspect = startW / startH;
            if (newWpx / newHpx > aspect) {
              newWpx = newHpx * aspect;
            } else {
              newHpx = newWpx / aspect;
            }
          }

          const newW = newWpx / imgW;
          const newH = newHpx / imgH;

          // clamp width/height and ensure overlay stays within image bounds
          const clampedW = Math.max(0.02, Math.min(1 - ov.x, newW));
          const clampedH = Math.max(0.02, Math.min(1 - ov.y, newH));
          return { ...ov, w: clampedW, h: clampedH };
        }
        return ov;
      })
    );
  }

  function onStagePointerUp(e) {
    if (!dragState.current) return;
    // release pointer captures (if any)
    try {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (el && el.hasPointerCapture && e.pointerId != null) {
        el.releasePointerCapture(e.pointerId);
      }
    } catch (err) {
      // ignore
    }
    dragState.current = null;
    setMode("idle");
  }

  // Remove overlay by id
  function removeOverlay(id) {
    setOverlays((prev) => prev.filter((o) => o.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  // Export: draw user image and overlays onto a canvas and download PNG
  async function exportPNG() {
    if (!imgRef.current || !userImageUrl) {
      alert("No user photo to export.");
      return;
    }

    const imgEl = imgRef.current;
    const naturalW = imgEl.naturalWidth || userImageNaturalSize.w || 1000;
    const naturalH = imgEl.naturalHeight || userImageNaturalSize.h || 1000;

    // The displayed image might have letterbox (object-fit: contain). We need the box where image is actually drawn.
    // Compute displayed image rect inside its container (imgRef.getBoundingClientRect gives that).
    const imgRect = imgEl.getBoundingClientRect();

    // But we want to draw onto a canvas at the natural resolution: naturalW x naturalH
    // For each overlay, we have percentages relative to displayed image area. We map these to natural pixels
    // by multiplying by naturalW/naturalH after mapping percent -> displayed px then proportionally to natural.

    // Load overlay images
    const overlayImages = await Promise.all(
      overlays.map(
        (ov) =>
          new Promise((resolve) => {
            const im = new Image();
            // enable CORS safe loading where possible
            im.crossOrigin = "anonymous";
            im.onload = () => resolve({ id: ov.id, img: im, ov });
            im.onerror = () => resolve({ id: ov.id, img: null, ov });
            im.src = ov.src;
          })
      )
    );

    // Create canvas
    const canvas = document.createElement("canvas");
    canvas.width = naturalW;
    canvas.height = naturalH;
    const ctx = canvas.getContext("2d");

    // Draw the user image to fill the canvas exactly at natural size
    // But user image may be rotated/EXIF etc; we assume browser normalized it when loading into <img>
    await new Promise((res) => {
      const tmp = new Image();
      tmp.crossOrigin = "anonymous";
      tmp.onload = () => {
        ctx.drawImage(tmp, 0, 0, naturalW, naturalH);
        res();
      };
      tmp.onerror = () => {
        // fallback: draw from imgRef's src
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, naturalW, naturalH);
        res();
      };
      tmp.src = userImageUrl;
    });

    // Now draw overlays by converting overlay percent (relative to displayed image) into natural image pixels.
    // To do that we need mapping factor between displayed image CSS size and natural size. Use imgRef dimensions.
    const displayedW = imgRef.current.clientWidth;
    const displayedH = imgRef.current.clientHeight;

    // However clientWidth/clientHeight are the drawn image size in CSS pixels (where percent coordinates apply)
    // compute ratio: natural / displayed
    const ratioX = naturalW / displayedW;
    const ratioY = naturalH / displayedH;

    overlayImages.forEach(({ img, ov }) => {
      if (!img) return;
      const xPxDisplayed = ov.x * displayedW;
      const yPxDisplayed = ov.y * displayedH;
      const wPxDisplayed = ov.w * displayedW;
      const hPxDisplayed = ov.h * displayedH;

      const xPxNatural = xPxDisplayed * ratioX;
      const yPxNatural = yPxDisplayed * ratioY;
      const wPxNatural = wPxDisplayed * ratioX;
      const hPxNatural = hPxDisplayed * ratioY;

      // draw the overlay; preserve overlay image aspect by drawing into the rect
      ctx.drawImage(img, xPxNatural, yPxNatural, wPxNatural, hPxNatural);
    });

    // Trigger download
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "tryon.png";
    a.click();
  }

  // Utility: convert stage click to de-select overlays
  function onStageClick(e) {
    // deselect when clicking empty stage area
    if (e.target === stageRef.current || e.target.id === "tryon-stage") {
      setSelectedId(null);
    }
  }

  // Attach global pointermove/up listeners on mount to catch pointer outside the stage
  useEffect(() => {
    const onMove = (e) => onStagePointerMove(e);
    const onUp = (e) => onStagePointerUp(e);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render
  return (
    <section id="virtual-tryon" className="mb-16">
      <h2 className="text-xl font-semibold mb-6 flex items-center">
        <span className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center mr-2 text-sm">
          4
        </span>
        Virtual Try-On
      </h2>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-medium">Try recommendations on your photo</h3>
                <p className="text-sm text-gray-500">
                  Upload a photo and overlay recommended items. Drag to position, use the handle to resize, and export when ready.
                </p>
              </div>
              <div className="text-sm text-gray-500">
                Tip: hold <span className="kbd">Shift</span> while dragging handle to scale proportionally
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50 flex items-center gap-4">
                <input ref={fileInputRef} id="user-photo-input" type="file" accept="image/*" className="hidden" onChange={onUserFileChange} />
                <button onClick={onClickUpload} className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors duration-300 inline-flex items-center">
                  <span className="material-symbols-outlined mr-2">person</span>
                  Upload Your Photo
                </button>

                <button onClick={onClearPhoto} id="clear-photo-btn" className="px-3 py-2 border rounded text-sm text-gray-700 hover:bg-gray-50">
                  Clear Photo
                </button>

                <div className="ml-auto flex items-center tryon-controls gap-3">
                  <button onClick={exportPNG} id="export-btn" className="px-4 py-2 bg-indigo-600 text-white rounded">
                    Export PNG
                  </button>
                  <button onClick={clearOverlays} id="clear-overlays-btn" className="px-3 py-2 border rounded text-sm text-gray-700">
                    Clear Overlays
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div id="stage-wrapper" className="w-full bg-white border rounded-lg p-4 flex justify-center items-center" style={{ minHeight: 420 }}>
                  <div
                    id="tryon-stage"
                    ref={stageRef}
                    onClick={onStageClick}
                    className="relative w-full max-w-2xl h-[420px] bg-gray-100 rounded overflow-hidden flex items-center justify-center"
                  >
                    {/* Empty placeholder */}
                    {!userImageUrl && (
                      <div id="stage-empty" className="text-center text-gray-400">
                        <div className="material-symbols-outlined text-6xl">photo_camera</div>
                        <div className="mt-2 text-sm">No photo uploaded</div>
                      </div>
                    )}

                    {/* User photo */}
                    {userImageUrl && (
                      <img
                        id="user-photo"
                        ref={imgRef}
                        src={userImageUrl}
                        alt="User"
                        className="w-full h-full object-contain block select-none"
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                      />
                    )}

                    {/* Overlays - absolutely positioned inside stage */}
                    {userImageUrl &&
                      overlays.map((ov) => {
                        const leftPercent = ov.x * 100;
                        const topPercent = ov.y * 100;
                        const wPercent = ov.w * 100;
                        const hPercent = ov.h * 100;
                        const isSelected = selectedId === ov.id;
                        return (
                          <div
                            key={ov.id}
                            className={`absolute border ${isSelected ? "border-blue-500 shadow-md" : "border-gray-300"} bg-transparent`}
                            style={{
                              left: `${leftPercent}%`,
                              top: `${topPercent}%`,
                              width: `${wPercent}%`,
                              height: `${hPercent}%`,
                              touchAction: "none",
                              boxSizing: "border-box",
                              cursor: mode === "idle" ? "move" : "grabbing",
                            }}
                            onPointerDown={(e) => onOverlayPointerDown(e, ov)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedId(ov.id);
                            }}
                          >
                            {/* image inside overlay fills area */}
                            <img
                              src={ov.src}
                              alt=""
                              draggable={false}
                              style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none", display: "block" }}
                            />

                            {/* bottom-right handle */}
                            <div
                              onPointerDown={(e) => onHandlePointerDown(e, ov)}
                              style={{
                                width: 14,
                                height: 14,
                                position: "absolute",
                                right: 2,
                                bottom: 2,
                                cursor: "nwse-resize",
                                background: "white",
                                border: "1px solid #cbd5e1",
                                borderRadius: 2,
                                boxSizing: "border-box",
                              }}
                            />
                            {/* small remove button */}
                            {isSelected && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeOverlay(ov.id);
                                }}
                                style={{
                                  position: "absolute",
                                  right: 4,
                                  top: 4,
                                  background: "rgba(255,255,255,0.9)",
                                  border: "1px solid #e5e7eb",
                                  borderRadius: 4,
                                  padding: "2px 6px",
                                  fontSize: 12,
                                }}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  Use the thumbnails on the right to add overlays. Click an overlay to select it, drag to move, drag the bottom-right handle to resize.
                </div>
              </div>
            </div>
          </div>

          {/* Right column: recommendations */}
          <div className="border-t lg:border-t-0 lg:border-l border-gray-200 lg:pl-6 pt-6 lg:pt-0">
            <h3 className="font-medium mb-4">Recommended items</h3>

            <div id="recs-list" className="grid grid-cols-1 gap-3">
              {recs.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded hover:bg-gray-50 transition">
                  <img src={r.src} className="w-16 h-16 object-cover rounded" alt={r.title} />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{r.title}</div>
                    <div className="text-xs text-gray-500">{r.category}</div>
                  </div>
                  <button
                    onClick={() => {
                      // place in center and moderate size; can be adjusted
                      addOverlay(r.src, 0.35, 0.2, 0.3, 0.3);
                    }}
                    className="add-rec-btn px-3 py-1 bg-primary-50 text-primary-600 rounded text-sm"
                    data-src={r.src}
                  >
                    Add
                  </button>
                </div>
              ))}

              <div className="mt-4">
                <button id="more-recs" className="w-full px-3 py-2 border rounded text-sm text-gray-700 hover:bg-gray-50">
                  See more
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
