import React, {useEffect, useRef, useState} from "react";


const SERVER_URL = import.meta.env.VITE_SERVER_URL;

export default function ItemComponent({selectedImage, selectedImageId, setSelectedImageId}) {

  const imgRef = useRef(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [items, setItems] = useState([]);
  const [mode, setMode] = useState(null);
  const [displaySize, setDisplaySize] = useState({w: 0, h: 0, left: 0, top: 0});

  // When selectedImage changes, reset items
  useEffect(() => {
    setItems((selectedImage?.items || []).map((it) => ({ ...it })));
  }, [selectedImage?.id]);

  function fetchImageItems() {
    const image_id = selectedImage.id;
    setSelectedImageId(null);
    setSelectedImageId(image_id);
  }

  async function saveDraft() {
    const resp = await fetch(`${SERVER_URL}/api/closet/items/add-items/`, {
      method: 'POST',
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(items)
    });
    fetchImageItems();
  }

  // FUNCTIONALITIES
  function boxFloatToInt(width, height, x0, y0, w, h) {
    const newX0 = Math.floor(width * x0);
    const newY0 = Math.floor(height * y0);
    const newW = Math.floor(width * w);
    const newH = Math.floor(height * h);
    return [newX0, newY0, newW, newH];
  }

  // function renderItemOverlay(it) {
  //   const isSelected = selectedItem.id === it.id;
  //
  //
  // }

  return (
    <section className="mb-16">
      <h2 className="text-xl font-semibold mb-6 flex items-center">
        <span className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center mr-2 text-sm">2</span>
          Verify Extracted Garments
      </h2>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="mb-6 pb-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-6">

            {/*Image area and overlay*/}
            <div className="md:w-1/3 rounded-lg overflow-hidden relative">
              <div style={{ position: "relative", width: "100%", height: "100%", userSelect: "none" }}>
                <img
                  ref={imgRef}
                  src={selectedImage?.url}
                  alt={selectedImage?.caption || selectedImage?.name}
                  className="w-full object-contain"
                  draggable={false}
                  onLoad={() => {
                    const rect = imgRef.current.getBoundingClientRect();
                    setDisplaySize({w: rect.width, h: rect.height, left: rect.left, top: rect.top});
                  }}
                />

                <div style={{ position: "absolute", left: 0, top: 0, width: displaySize.w || "100%", height: displaySize.h || "100%" }}>
                  {/*{ items?.length > 0 ? items.map((it) => renderItemOverlay(it)) : ""}*/}
                </div>
              </div>
            </div>

            {/*Image item details*/}
            <div className="md:w-2/3">
              <h3 className="font-medium mb-4">Detected Items ({items?.length || 0})</h3>

              <div className="space-y-4">
                {/* List of items (editable forms) */}
                { items?.length > 0 ? (items.map((it) => {
                  const thumbStyle = boxFloatToInt(displaySize.w, displaySize.h, it.bbox_x0, it.bbox_y0, it.bbox_w, it.bbox_h);
                  const isSelected = selectedItem?.id === it.id;
                  return (
                    <div key={it.id} onClick={() => setSelectedItem(it)} className={`border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow duration-300 cursor-pointer ${isSelected ? "ring-2 ring-blue-700" : ""}`}>
                      <div className="flex gap-4">
                        {/* Left column: thumbnail */}
                        <div className="w-50 h-60 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                          <div style={{
                            backgroundImage: `url(${selectedImage?.url})`,
                            backgroundSize: `${displaySize.w}px ${displaySize.h}px`,
                            // backgroundPosition: `-${Math.ceil(it.bbox_x0 * displaySize.w)}px -${Math.ceil(it.bbox_y0 * displaySize.h)}px`,
                            width: "100%",
                            height: "100%",
                            backgroundRepeat: "no-repeat",
                          }}
                          />
                        </div>

                        {/* Right column: details split into rows */}
                        <div className="flex-1 grid grid-rows-[auto_auto_auto_auto] gap-2">
                          {/* Row 1: ID + delete */}
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-700 font-medium">
                              {it.caption ? it.caption : `(${it.id})`}
                            </div>
                            <div className="flex items-center space-x-2">
                              <button title="Delete" onClick={() => setItems(items.filter((xt) => xt.id !== it.id))} className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-300">
                                <span className="material-symbols-outlined text-gray-500">delete</span>
                              </button>
                            </div>
                          </div>

                          {/* Row 2: type select + bbox coordinates */}
                          <div className="flex gap-2 items-center">
                            <div className="flex-1">
                              <label className="block text-xs text-gray-500 mb-1">Type</label>
                              <select defaultValue={it.type} onChange={(e) => {it.type = e.target.value}} className="w-40 p-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500">
                                <option value="shirt">Shirt</option>
                                <option value="pants">Pants</option>
                              </select>
                            </div>

                            <div className="flex-4">
                              <label className="block text-xs text-gray-500 mb-1">BBox (x0, y0, w, h)</label>
                              <div className="grid grid-cols-4 gap-1">
                                <input type="number" defaultValue={it.bbox_x0} onChange={(e) => {it.bbox_x0 = e.target.value}} className="p-2 border border-gray-300 rounded-md text-sm w-20"/>
                                <input type="number" defaultValue={it.bbox_y0} onChange={(e) => {it.bbox_y0 = e.target.value}}  className="p-2 border border-gray-300 rounded-md text-sm"/>
                                <input type="number" defaultValue={it.bbox_w} onChange={(e) => {it.bbox_w = e.target.value}} className="p-2 border border-gray-300 rounded-md text-sm"/>
                                <input type="number" defaultValue={it.bbox_h} onChange={(e) => {it.bbox_h = e.target.value}} className="p-2 border border-gray-300 rounded-md text-sm"/>
                              </div>
                            </div>
                          </div>

                          {/* Row 3: caption editing */}
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Caption</label>
                            <input defaultValue={it.caption} onChange={(e) => {it.caption = e.target.value}} className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"/>
                          </div>

                          {/* Row 4: action buttons (move / resize) */}
                          <div className="flex items-center justify-start gap-2">
                            <button onClick={(e) => { setMode(`${mode !== "move" ? "move" : "idle"}`); }} className={`px-3 py-1 border rounded text-sm ${mode === "move" ? "bg-primary-600 text-white" : ""}`}>
                              <span className="material-symbols-outlined mr-1 align-middle">open_with</span>
                              Move
                            </button>

                            <button onClick={(e) => { setMode(`${mode !== "resize" ? "resize" : "idle"}`); }} className={`px-3 py-1 border rounded text-sm ${mode === "resize" ? "bg-primary-600 text-white" : ""}`}>
                              <span className="material-symbols-outlined mr-1 align-middle">square_foot</span>
                              Resize
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })) : ""}


                <button onClick={() => { setMode(`${mode !== "draw" ? "draw" : "idle"}`); }} className={`w-full py-2 border border-gray-300 border-dashed rounded-lg text-sm text-gray-500 ${mode === "draw" ? "hover:border-white-400 hover:text-white-600 border-primary-300 bg-primary-600 text-white" : "hover:border-primary-400 hover:text-primary-600"} transition-colors duration-300 flex items-center justify-center`}>
                  <span className="material-symbols-outlined mr-1">add</span>
                  {mode !== "draw" ? "Add another item" : "Draw bbox on the image"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/*Submit the draft*/}
        <div className="flex justify-between mt-6">
          <button className="text-gray-600 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors duration-300 inline-flex items-center">
            <span className="material-symbols-outlined mr-1">arrow_back</span>
            Back to Upload
          </button>

          <div className="flex items-center gap-3">
            <button onClick={async () => {await saveDraft(); }} className="px-4 py-2 border rounded-md">
              Save draft
            </button>

            <button className="bg-primary-600 text-white px-5 py-2 rounded-md hover:bg-primary-700 transition-colors duration-300 inline-flex items-center">
              <span>Continue to Outfit Request</span>
              <span className="material-symbols-outlined ml-1">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

    </section>
  );
}