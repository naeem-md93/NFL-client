import React, { useRef, useState, useEffect } from "react";

/**
 * ClosetImageEditor
 *
 * Props:
 * - selectedImage: the image object you provided (id, url, width, height, items[])
 * - onChange(items) optional: called when items change (move/resize/edit/add/delete)
 * - onSave(items) optional: called when user clicks "Continue to Outfit Request"
 *
 * Notes:
 * - Items' bboxes are stored/returned in ORIGINAL image pixel coordinates
 *   (selectedImage.width / height). The component converts to displayed coordinates.
 */

export default function ClosetImageEditor({ selectedImage, onChange, onSave }) {
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  // Local copy of items (we store bbox in pixels relative to original image dims)
  const [items, setItems] = useState(() =>
    (selectedImage?.items || []).map((it) => ({ ...it }))
  );

  // UI state
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState("idle"); // 'idle' | 'move' | 'resize' | 'drawing'
  const [actionData, setActionData] = useState(null); // helper for drag/resizing/drawing
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0, left: 0, top: 0 });

  // When selectedImage changes, reset items
  useEffect(() => {
    setItems((selectedImage?.items || []).map((it) => ({ ...it })));
  }, [selectedImage?.id]);

  // update display size once image loads or window resizes
  useEffect(() => {
    function updateSize() {
      const img = imgRef.current;
      if (!img) return;
      const rect = img.getBoundingClientRect();
      setDisplaySize({ w: rect.width, h: rect.height, left: rect.left, top: rect.top });
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [selectedImage?.url]);

  useEffect(() => {
    if (onChange) onChange(items);
  }, [items]);

  // Helpers: coordinate conversions between displayed coords and original pixel coords
  function dispToOrigCoords(x, y) {
    // x,y are relative to image element (pixels) in displayed coordinates
    const { w: dispW, h: dispH } = displaySize;
    const origW = selectedImage?.width || dispW;
    const origH = selectedImage?.height || dispH;
    const rx = origW / Math.max(1, dispW || 1);
    const ry = origH / Math.max(1, dispH || 1);
    return [Math.round(x * rx), Math.round(y * ry)];
  }

  function origToDispCoords(x, y) {
    const { w: dispW, h: dispH } = displaySize;
    const origW = selectedImage?.width || dispW;
    const origH = selectedImage?.height || dispH;
    const rx = dispW / Math.max(1, origW || 1);
    const ry = dispH / Math.max(1, origH || 1);
    return [Math.round(x * rx), Math.round(y * ry)];
  }

  // Convert bbox from original pixels to display top/left/width/height
  function bboxOrigToStyle(bbox) {
    const [x0, y0, x1, y1] = bbox;
    const [dx0, dy0] = origToDispCoords(x0, y0);
    const [dx1, dy1] = origToDispCoords(x1, y1);
    const left = Math.min(dx0, dx1);
    const top = Math.min(dy0, dy1);
    const width = Math.abs(dx1 - dx0);
    const height = Math.abs(dy1 - dy0);
    return { left, top, width, height };
  }

  // Mouse / pointer events for moving/resizing/drawing
  function onPointerDownImage(e) {
    // If currently in "Add" drawing mode, start rectangle
    if (mode === "start-draw") {
      const imgRect = imgRef.current.getBoundingClientRect();
      const x = e.clientX - imgRect.left;
      const y = e.clientY - imgRect.top;
      setMode("drawing");
      setActionData({ startX: x, startY: y, curX: x, curY: y });
      // prevent default to capture pointermove
      e.preventDefault();
      return;
    }
    // otherwise deselect
    setSelectedId(null);
  }

  function onPointerMoveImage(e) {
    if (mode === "drawing" && actionData) {
      const imgRect = imgRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(imgRect.width, e.clientX - imgRect.left));
      const y = Math.max(0, Math.min(imgRect.height, e.clientY - imgRect.top));
      setActionData((d) => ({ ...d, curX: x, curY: y }));
    } else if ((mode === "move" || mode === "resize") && actionData) {
      const imgRect = imgRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(imgRect.width, e.clientX - imgRect.left));
      const y = Math.max(0, Math.min(imgRect.height, e.clientY - imgRect.top));
      // move or resize by updating items
      setItems((prev) => {
        const idx = prev.findIndex((p) => p.id === actionData.id);
        if (idx === -1) return prev;
        const newItems = prev.slice();
        const it = { ...newItems[idx] };
        // convert displayed delta to original coords
        const [origX, origY] = dispToOrigCoords(x, y);
        if (mode === "move") {
          const deltaDispX = x - actionData.pointerStartX;
          const deltaDispY = y - actionData.pointerStartY;
          const [deltaOrigX, deltaOrigY] = dispToOrigCoords(deltaDispX, deltaDispY);
          it.bbox_x0 = actionData.origBBox[0] + deltaOrigX;
          it.bbox_y0 = actionData.origBBox[1] + deltaOrigY;
          it.bbox_x1 = actionData.origBBox[2] + deltaOrigX;
          it.bbox_y1 = actionData.origBBox[3] + deltaOrigY;
        } else if (mode === "resize") {
          // actionData.resizeHandle identifies corner: 'nw','ne','sw','se'
          let [x0, y0, x1, y1] = actionData.origBBox;
          // convert current display point to orig
          const [curOrigX, curOrigY] = dispToOrigCoords(x, y);
          switch (actionData.resizeHandle) {
            case "nw":
              x0 = curOrigX;
              y0 = curOrigY;
              break;
            case "ne":
              x1 = curOrigX;
              y0 = curOrigY;
              break;
            case "sw":
              x0 = curOrigX;
              y1 = curOrigY;
              break;
            case "se":
              x1 = curOrigX;
              y1 = curOrigY;
              break;
            default:
              break;
          }
          // ensure sanity: x1>x0, y1>y0
          if (x1 <= x0) x1 = x0 + 1;
          if (y1 <= y0) y1 = y0 + 1;
          it.bbox_x0 = x0;
          it.bbox_y0 = y0;
          it.bbox_x1 = x1;
          it.bbox_y1 = y1;
        }
        newItems[idx] = it;
        return newItems;
      });
    }
  }

  function onPointerUpImage(e) {
    if (mode === "drawing" && actionData) {
      // finalize create new item
      const { startX, startY, curX, curY } = actionData;
      // ignore tiny boxes
      if (Math.abs(curX - startX) > 6 && Math.abs(curY - startY) > 6) {
        const x0Disp = Math.min(startX, curX);
        const y0Disp = Math.min(startY, curY);
        const x1Disp = Math.max(startX, curX);
        const y1Disp = Math.max(startY, curY);
        const [x0Orig, y0Orig] = dispToOrigCoords(x0Disp, y0Disp);
        const [x1Orig, y1Orig] = dispToOrigCoords(x1Disp, y1Disp);
        const newItem = {
          id: generateTempId(),
          type: "shirt",
          caption: "",
          bbox_x0: x0Orig,
          bbox_y0: y0Orig,
          bbox_x1: x1Orig,
          bbox_y1: y1Orig,
          created_at: new Date().toISOString(),
        };
        setItems((prev) => {
          const updated = [...prev, newItem];
          if (onChange) onChange(updated);
          return updated;
        });
        setSelectedId(newItem.id);
      }
      setActionData(null);
      setMode("idle");
      return;
    }

    // finalize move/resize
    if ((mode === "move" || mode === "resize") && actionData) {
      setActionData(null);
      setMode("idle");
      if (onChange) onChange(items);
      return;
    }
  }

  // Helpers: start move or resize for an item
  function startMove(e, item) {
    e.stopPropagation();
    const imgRect = imgRef.current.getBoundingClientRect();
    const pointerX = Math.max(0, Math.min(imgRect.width, e.clientX - imgRect.left));
    const pointerY = Math.max(0, Math.min(imgRect.height, e.clientY - imgRect.top));
    // store pointer start in displayed coords for delta calculation
    setActionData({
      id: item.id,
      pointerStartX: pointerX,
      pointerStartY: pointerY,
      origBBox: [item.bbox_x0, item.bbox_y0, item.bbox_x1, item.bbox_y1],
    });
    setMode("move");
    setSelectedId(item.id);
    e.preventDefault();
  }

  function startResize(e, item, handle) {
    e.stopPropagation();
    const imgRect = imgRef.current.getBoundingClientRect();
    const pointerX = Math.max(0, Math.min(imgRect.width, e.clientX - imgRect.left));
    const pointerY = Math.max(0, Math.min(imgRect.height, e.clientY - imgRect.top));
    setActionData({
      id: item.id,
      pointerStartX: pointerX,
      pointerStartY: pointerY,
      origBBox: [item.bbox_x0, item.bbox_y0, item.bbox_x1, item.bbox_y1],
      resizeHandle: handle,
    });
    setMode("resize");
    setSelectedId(item.id);
    e.preventDefault();
  }

  // Utility for generating a temporary id (not UUID backend)
  function generateTempId() {
    return "tmp_" + Math.random().toString(36).slice(2, 9);
  }

  // Edit item fields
  function updateItemField(id, field, value) {
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === -1) return prev;
      const newItems = prev.slice();
      newItems[idx] = { ...newItems[idx], [field]: value };
      if (onChange) onChange(newItems);
      return newItems;
    });
  }

  function deleteItem(id) {
    setItems((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      if (onChange) onChange(updated);
      return updated;
    });
    if (selectedId === id) setSelectedId(null);
  }

  // Render rectangle overlays
  function renderItemOverlay(item) {
    const style = bboxOrigToStyle([item.bbox_x0, item.bbox_y0, item.bbox_x1, item.bbox_y1]);
    const isSelected = selectedId === item.id;
    return (
      <div
        key={item.id}
        className={`absolute border ${isSelected ? "border-primary-500" : "border-yellow-400"} bg-transparent`}
        style={{
          left: style.left,
          top: style.top,
          width: style.width,
          height: style.height,
          boxSizing: "border-box",
          pointerEvents: "auto",
        }}
        // clicking rectangle selects and starts move on pointer down
        onPointerDown={(e) => startMove(e, item)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setSelectedId(item.id);
        }}
      >
        {/* Label */}
        <div
          className={`absolute -top-6 left-0 text-xs px-1 rounded-sm ${isSelected ? "bg-primary-600 text-white" : "bg-yellow-400 text-black"}`}
          style={{ transform: "translateY(-4px)" }}
        >
          {item.type}
        </div>

        {/* Resize handles */}
        {isSelected && (
          <>
            {/* NW */}
            <div
              onPointerDown={(e) => startResize(e, item, "nw")}
              className="absolute w-3 h-3 bg-white border border-gray-600 rounded-sm"
              style={{ left: -6, top: -6, cursor: "nwse-resize" }}
            />
            {/* NE */}
            <div
              onPointerDown={(e) => startResize(e, item, "ne")}
              className="absolute w-3 h-3 bg-white border border-gray-600 rounded-sm"
              style={{ right: -6, top: -6, cursor: "nesw-resize" }}
            />
            {/* SW */}
            <div
              onPointerDown={(e) => startResize(e, item, "sw")}
              className="absolute w-3 h-3 bg-white border border-gray-600 rounded-sm"
              style={{ left: -6, bottom: -6, cursor: "nesw-resize" }}
            />
            {/* SE */}
            <div
              onPointerDown={(e) => startResize(e, item, "se")}
              className="absolute w-3 h-3 bg-white border border-gray-600 rounded-sm"
              style={{ right: -6, bottom: -6, cursor: "nwse-resize" }}
            />
          </>
        )}
      </div>
    );
  }

  // Compute drawing preview rectangle when drawing
  function renderDrawingPreview() {
    if (mode !== "drawing" || !actionData) return null;
    const { startX, startY, curX, curY } = actionData;
    const left = Math.min(startX, curX);
    const top = Math.min(startY, curY);
    const width = Math.abs(curX - startX);
    const height = Math.abs(curY - startY);
    return (
      <div
        style={{
          position: "absolute",
          left,
          top,
          width,
          height,
          border: "2px dashed #0ea5a4",
          background: "rgba(14,165,164,0.07)",
          pointerEvents: "none",
        }}
      />
    );
  }

  // Main render
  return (
    <section className="mb-16">
      <h2 className="text-xl font-semibold mb-6 flex items-center">
        <span className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center mr-2 text-sm">
          {items.length}
        </span>
        Verify Extracted Garments
      </h2>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="mb-6 pb-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3 rounded-lg overflow-hidden relative" ref={containerRef}>
              {/* Image area with overlays */}
              <div
                style={{ position: "relative", width: "100%", height: "100%", userSelect: "none" }}
                onPointerMove={onPointerMoveImage}
                onPointerUp={onPointerUpImage}
              >
                <img
                  ref={imgRef}
                  src={selectedImage?.url}
                  alt={selectedImage?.name}
                  className="w-full object-contain"
                  onLoad={() => {
                    // recalc sizes when loaded
                    const rect = imgRef.current.getBoundingClientRect();
                    setDisplaySize({ w: rect.width, h: rect.height, left: rect.left, top: rect.top });
                  }}
                  onPointerDown={onPointerDownImage}
                />

                {/* overlays: position absolute inside the same stacking root */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: displaySize.w || "100%",
                    height: displaySize.h || "100%",
                  }}
                >
                  {/* render items */}
                  {items.map((it) => renderItemOverlay(it))}
                  {/* drawing preview */}
                  {renderDrawingPreview()}
                </div>
              </div>
            </div>

            <div className="md:w-2/3">
              <h3 className="font-medium mb-4">Detected Items ({items?.length || 0})</h3>

              <div className="space-y-4">
                {/* List of items (editable forms) */}
                {items.map((it) => {
                  const thumbStyle = bboxOrigToStyle([it.bbox_x0, it.bbox_y0, it.bbox_x1, it.bbox_y1]);
                  // compute small thumbnail URL by cropping server-side is ideal; here we show overlay box on original image via inline background
                  const isSelected = selectedId === it.id;
                  return (
                    <div
                      key={it.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow duration-300 cursor-pointer"
                      onClick={() => setSelectedId(it.id)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 relative">
                          {/* Simple thumbnail: position a background of the main image to show the crop region */}
                          <div
                            style={{
                              backgroundImage: `url(${selectedImage?.url})`,
                              backgroundSize: `${displaySize.w}px ${displaySize.h}px`,
                              backgroundPosition: `-${thumbStyle.left}px -${thumbStyle.top}px`,
                              width: "100%",
                              height: "100%",
                              backgroundRepeat: "no-repeat",
                              transform: "scale(1.05)",
                              transformOrigin: "top left",
                            }}
                          />
                        </div>

                        <div className="flex-grow">
                          <div className="flex justify-between mb-2">
                            <h4 className="font-medium">{it.caption || `${it.type} (${it.id.slice(0, 6)})`}</h4>
                            <div className="flex space-x-1">
                              <button
                                title="Select & Move"
                                onClick={() => {
                                  setSelectedId(it.id);
                                  setMode("idle");
                                }}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-300"
                              >
                                <span className="material-symbols-outlined text-gray-500">open_with</span>
                              </button>
                              <button
                                title="Delete"
                                onClick={() => deleteItem(it.id)}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-300"
                              >
                                <span className="material-symbols-outlined text-gray-500">delete</span>
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Type</label>
                              <select
                                value={it.type}
                                onChange={(e) => updateItemField(it.id, "type", e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                              >
                                <option value="shirt">Shirt</option>
                                <option value="pants">Pants</option>
                                <option value="outerwear">Outerwear</option>
                                <option value="dresses">Dresses</option>
                                <option value="footwear">Footwear</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Caption</label>
                              <input
                                value={it.caption}
                                onChange={(e) => updateItemField(it.id, "caption", e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                              />
                            </div>
                          </div>

                          <div className="flex items-center">
                            <div className="flex items-center mr-4">
                              <input
                                type="checkbox"
                                id={`favorite-${it.id}`}
                                className="mr-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                              />
                              <label htmlFor={`favorite-${it.id}`} className="text-sm">
                                Favorite
                              </label>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id={`correct-${it.id}`}
                                defaultChecked
                                className="mr-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                              />
                              <label htmlFor={`correct-${it.id}`} className="text-sm">
                                Correct
                              </label>
                            </div>
                          </div>

                          {/* small controls when item is selected */}
                          {isSelected && (
                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={() => {
                                  // if user wants to start drawing a new box, we'll set mode to start-draw
                                  setMode("start-draw");
                                }}
                                className="px-3 py-1 border rounded text-sm"
                              >
                                Add new box
                              </button>
                              <button
                                onClick={() => {
                                  // start manual move mode (user must drag on overlay)
                                  setMode("idle");
                                }}
                                className="px-3 py-1 border rounded text-sm"
                              >
                                Move / Resize
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={() => {
                    // enable drawing on image: user will click+drag on image to draw new box
                    setMode("start-draw");
                  }}
                  className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors duration-300 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined mr-1">add</span>
                  Add another item
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={() => {
                // go back action - caller can choose to handle navigation
                window.history.back();
              }}
              className="text-gray-600 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors duration-300 inline-flex items-center"
            >
              <span className="material-symbols-outlined mr-1">arrow_back</span>
              Back to Upload
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  // call onChange once more
                  if (onChange) onChange(items);
                }}
                className="px-4 py-2 border rounded-md"
              >
                Save draft
              </button>

              <button
                onClick={() => {
                  if (onSave) onSave(items);
                }}
                className="bg-primary-600 text-white px-5 py-2 rounded-md hover:bg-primary-700 transition-colors duration-300 inline-flex items-center"
              >
                <span>Continue to Outfit Request</span>
                <span className="material-symbols-outlined ml-1">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
