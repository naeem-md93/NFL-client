import React, { useEffect, useRef, useState } from "react";

export default function ItemComponent({
                                        setItems, // function(updatedItem) -> parent will merge
                                        deleteItem,
                                        item,
                                        setSelectedItem,
                                        selectedItem,
                                        mode,
                                        setMode,
                                        setIsDrawing,
                                        selectItem,
                                        selectedImage,
                                      }) {
  const thumbnailRef = useRef(null);

  // convert relative item values to pixel box
  function relToPx(rel) {
    const imgW = selectedImage?.width || 1;
    const imgH = selectedImage?.height || 1;
    return {
      w: Math.round(rel.box_w * imgW),
      h: Math.round(rel.box_h * imgH),
      x: Math.round(rel.box_x * imgW),
      y: Math.round(rel.box_y * imgH),
    };
  }
  function pxToRel(px) {
    const imgW = selectedImage?.width || 1;
    const imgH = selectedImage?.height || 1;
    return {
      box_x: px.x / imgW,
      box_y: px.y / imgH,
      box_w: px.w / imgW,
      box_h: px.h / imgH,
    };
  }

  const [box, setBox] = useState(relToPx(item));
  const dragRef = useRef(null); // for move / resize dragging
  const [showZoomControls, setShowZoomControls] = useState(false);

  // keep box in sync when item changes externally
  useEffect(() => {
    setBox(relToPx(item));
  }, [item.box_x, item.box_y, item.box_w, item.box_h, selectedImage?.width, selectedImage?.height]);

  function isSelected() {
    return selectedItem?.id === item?.id;
  }

  function isMode(m) {
    return mode === m;
  }

  function handleDelete() {
    deleteItem(item.id);
  }

  function selectMode(value) {
    selectItem(item);
    setMode(value);
    setShowZoomControls(value === "zoom");
  }

  // Manual input updates (pixel inputs)
  function updateBoxInput(key, e) {
    const v = Number(e.target.value);
    if (Number.isNaN(v)) return;
    const nb = { ...box, [key]: Math.round(v) };
    // clamp width/height and positions
    nb.w = Math.max(1, nb.w);
    nb.h = Math.max(1, nb.h);
    if (nb.x < 0) nb.x = 0;
    if (nb.y < 0) nb.y = 0;
    if (nb.x + nb.w > (selectedImage?.width || nb.w)) nb.x = Math.max(0, (selectedImage?.width || nb.w) - nb.w);
    if (nb.y + nb.h > (selectedImage?.height || nb.h)) nb.y = Math.max(0, (selectedImage?.height || nb.h) - nb.h);

    setBox(nb);
    const rel = pxToRel(nb);
    setItems({ ...item, ...rel });
  }

  // MOVE: start dragging from thumbnail area
  function startMove(e) {
    if (!isMode("move")) return;
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    dragRef.current = {
      type: "move",
      startX,
      startY,
      startBox: { ...box },
    };
    window.addEventListener("mousemove", onDrag);
    window.addEventListener("mouseup", endDrag);
  }

  // RESIZE: right handle (scale-X)
  function startResizeX(e) {
    if (!isMode("resize")) return;
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      type: "resizeX",
      startX: e.clientX,
      startW: box.w,
    };
    window.addEventListener("mousemove", onDrag);
    window.addEventListener("mouseup", endDrag);
  }

  // RESIZE: bottom handle (scale-Y)
  function startResizeY(e) {
    if (!isMode("resize")) return;
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      type: "resizeY",
      startY: e.clientY,
      startH: box.h,
    };
    window.addEventListener("mousemove", onDrag);
    window.addEventListener("mouseup", endDrag);
  }

  function onDrag(e) {
    if (!dragRef.current) return;
    const ds = dragRef.current;
    if (ds.type === "move") {
      const dx = Math.round(e.clientX - ds.startX);
      const dy = Math.round(e.clientY - ds.startY);
      const nb = {
        ...ds.startBox,
        x: Math.max(0, Math.min((selectedImage?.width || ds.startBox.x + ds.startBox.w) - ds.startBox.w, ds.startBox.x + dx)),
        y: Math.max(0, Math.min((selectedImage?.height || ds.startBox.y + ds.startBox.h) - ds.startBox.h, ds.startBox.y + dy)),
      };
      setBox(nb);
      const rel = pxToRel(nb);
      setItems({ ...item, ...rel });
    } else if (ds.type === "resizeX") {
      const delta = Math.round(e.clientX - ds.startX);
      let newW = Math.max(1, ds.startW + delta);
      // clamp to image width
      newW = Math.min(newW, (selectedImage?.width || newW) - box.x);
      const nb = { ...box, w: newW };
      setBox(nb);
      const rel = pxToRel(nb);
      setItems({ ...item, ...rel });
    } else if (ds.type === "resizeY") {
      const delta = Math.round(e.clientY - ds.startY);
      let newH = Math.max(1, ds.startH + delta);
      newH = Math.min(newH, (selectedImage?.height || newH) - box.y);
      const nb = { ...box, h: newH };
      setBox(nb);
      const rel = pxToRel(nb);
      setItems({ ...item, ...rel });
    }
  }

  function endDrag() {
    dragRef.current = null;
    window.removeEventListener("mousemove", onDrag);
    window.removeEventListener("mouseup", endDrag);
  }

  // ZOOM controls: zoom in/out about box center using buttons
  function zoomBy(factor) {
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    let newW = Math.max(1, Math.round(box.w * factor));
    let newH = Math.max(1, Math.round(box.h * factor));

    // compute new top-left to keep center
    let newX = Math.round(cx - newW / 2);
    let newY = Math.round(cy - newH / 2);

    // clamp within image
    if (newX < 0) newX = 0;
    if (newY < 0) newY = 0;
    if (newX + newW > (selectedImage?.width || newW)) newW = (selectedImage?.width || newW) - newX;
    if (newY + newH > (selectedImage?.height || newH)) newH = (selectedImage?.height || newH) - newY;

    const nb = { x: newX, y: newY, w: newW, h: newH };
    setBox(nb);
    const rel = pxToRel(nb);
    setItems({ ...item, ...rel });
  }

  // small convenience for save (keeps relative values updated)
  function handleSave() {
    const rel = pxToRel(box);
    setItems({ ...item, ...rel });
    setMode("idle");
    setShowZoomControls(false);
  }

  function handleCancel() {
    setBox(relToPx(item)); // revert
    setMode("idle");
    setShowZoomControls(false);
  }

  // thumbnail background style similar to your original
  const thumbStyle = {
    backgroundImage: `url(${selectedImage?.url})`,
    backgroundSize: `${selectedImage?.width}px ${selectedImage?.height}px`,
    backgroundPosition: `-${box.x}px -${box.y}px`,
    width: "100%",
    height: "100%",
    borderRadius: 6,
    backgroundRepeat: "no-repeat",
    cursor: isMode("move") ? "grab" : "default",
  };

  return (
    <div className={`border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow duration-300 cursor-pointer ${isSelected() ? "ring-4 ring-fuchsia-900" : ""}`}>
      <div className="flex gap-4">
        <div className="w-50 h-60 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
          <div
            className={"rounded-md overflow-hidden"}
            ref={thumbnailRef}
            style={thumbStyle}
            onMouseDown={startMove}
            onClick={() => setSelectedItem(item)}
            draggable={false}
            title="Click to select. In Move mode drag to move the box. In Resize mode drag handles."
          />
        </div>

        {/* Right column: details split into rows */}
        <div className="flex-1 grid grid-rows-[auto_auto_auto_auto] gap-2">
          {/* Row 1: ID + delete */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-700 font-medium">{item.caption ? item.caption : `(${item.id})`}</div>
            <div className="flex items-center space-x-2">
              <button onClick={() => handleDelete()} title="Delete" className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-300">
                <span className="material-symbols-outlined text-gray-500">delete</span>
              </button>
            </div>
          </div>

          {/* Row 2: type select + bbox coordinates */}
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Type</label>
              <select defaultValue={item.type} onChange={(e) => setItems({ ...item, type: e.target.value })} className="w-40 p-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500">
                <option value="">(none)</option>
                <option value="shirt">Shirt</option>
                <option value="pants">Pants</option>
              </select>
            </div>

            <div className="flex-4">
              <label className="block text-xs text-gray-500 mb-1">BBox (X, Y, W, H) px</label>
              <div className="grid grid-cols-4 gap-1">
                <input type="number" value={box.x} onChange={(e) => updateBoxInput("x", e)} className="p-2 border border-gray-300 rounded-md text-sm w-20" />
                <input type="number" value={box.y} onChange={(e) => updateBoxInput("y", e)} className="p-2 border border-gray-300 rounded-md text-sm w-20" />
                <input type="number" value={box.w} onChange={(e) => updateBoxInput("w", e)} className="p-2 border border-gray-300 rounded-md text-sm w-20" />
                <input type="number" value={box.h} onChange={(e) => updateBoxInput("h", e)} className="p-2 border border-gray-300 rounded-md text-sm w-20" />
              </div>
            </div>
          </div>

          {/* Row 3: caption editing */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Caption</label>
            <input value={item.caption} onChange={(e) => setItems({ ...item, caption: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500" />
          </div>

          {/* Row 4: action buttons (move / resize / zoom) + handles */}
          <div className="flex items-center justify-start gap-2">
            <button onClick={() => selectMode("move")} className={`px-3 py-1 border rounded text-sm ${(isSelected() && isMode("move")) ? "hover:border-white-400 hover:text-white-600 border-primary-300 bg-primary-600 text-white" : "hover:border-primary-400 hover:text-primary-600"} transition-colors duration-300 flex items-center justify-center`}>
              <span className="material-symbols-outlined mr-1 align-middle">open_with</span> Move
            </button>

            <button onClick={() => selectMode("resize")} className={`px-3 py-1 border rounded text-sm ${(isSelected() && isMode("resize")) ? "hover:border-white-400 hover:text-white-600 border-primary-300 bg-primary-600 text-white" : "hover:border-primary-400 hover:text-primary-600"} transition-colors duration-300 flex items-center justify-center`}>
              <span className="material-symbols-outlined mr-1 align-middle">square_foot</span> Resize
            </button>

            <button onClick={() => selectMode("zoom")} className={`px-3 py-1 border rounded text-sm ${(isSelected() && isMode("zoom")) ? "hover:border-white-400 hover:text-white-600 border-primary-300 bg-primary-600 text-white" : "hover:border-primary-400 hover:text-primary-600"} transition-colors duration-300 flex items-center justify-center`}>
              <span className="material-symbols-outlined mr-1 align-middle">zoom_in</span> Zoom
            </button>

            <button onClick={() => setSelectedItem(item)} className={`px-3 py-1 border rounded text-sm border-red-500 text-white bg-red-900 transition-colors duration-300 flex items-center justify-center`}>
              <span className="material-symbols-outlined mr-1 align-middle">clear</span> Cancel
            </button>

            <button onClick={() => handleSave()} className={`px-3 py-1 border rounded text-sm border-green-500 text-white bg-green-900 transition-colors duration-300 flex items-center justify-center `}>
              <span className="material-symbols-outlined mr-1 align-middle">check</span> Save
            </button>

            {/* Resize handles visible when mode === resize */}
            {isMode("resize") && (
              <div className="ml-4 flex items-center gap-2">
                <div onMouseDown={startResizeX} style={{ width: 16, height: 28, background: "#f3f3f3", border: "1px solid #d0d0d0", cursor: "ew-resize", borderRadius: 4 }} title="Drag horizontally to scale X" />
                <div onMouseDown={startResizeY} style={{ width: 28, height: 16, background: "#f3f3f3", border: "1px solid #d0d0d0", cursor: "ns-resize", borderRadius: 4 }} title="Drag vertically to scale Y" />
              </div>
            )}

            {/* Zoom controls appear when mode === zoom */}
            {isMode("zoom") && (
              <div className="ml-4 flex items-center gap-2">
                <button onClick={() => zoomBy(1.15)} title="Zoom in" className="px-2 py-1 border rounded">+</button>
                <button onClick={() => zoomBy(0.85)} title="Zoom out" className="px-2 py-1 border rounded">−</button>
                <button onClick={() => setShowZoomControls((s) => !s)} className="px-2 py-1 border rounded">toggle</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}