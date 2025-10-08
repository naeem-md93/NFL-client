import { v4 as uuid4 } from "uuid";
import React, { useEffect, useState } from "react";

import ItemComponent from "./Item.jsx";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;
const ITEMS_URL = `${SERVER_URL}/api/closet/items/`;

export default function ItemsComponent({ selectedImage }) {
  // keep items as map/object like your original code
  const [items, setItems] = useState(listItemsToObjects());
  const [currentItem, setCurrentItem] = useState(null);

  useEffect(() => {
    // re-initialize when selectedImage changes
    setItems(listItemsToObjects());
  }, [selectedImage?.items]);

  useEffect(() => {
    console.log("Items updated", items);
  }, [items]);

  function listItemsToObjects() {
    if (!selectedImage?.items) return {};
    return Object.fromEntries((selectedImage?.items || []).map((it) => [it.id, it]));
  }

  function addItem() {
    const newId = uuid4();
    const newItem = {
      id: newId,
      caption: "New Item",
      height: selectedImage?.height || 1,
      width: selectedImage?.width || 1,
      type: null,
      // keep relative coords [0..1]
      box_x: 0,
      box_y: 0,
      box_w: 1,
      box_h: 1,
    };
    setItems((prev) => ({ ...prev, [newId]: newItem }));
  }

  // update a single item (object map)
  function updateItem(updated) {
    setItems((prev) => ({ ...prev, [updated.id]: { ...(prev[updated.id] || {}), ...updated } }));
  }

  function deleteItem(id) {
    setItems((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    if (currentItem?.id === id) setCurrentItem(null);
  }

  return (
    <section className="mb-16">
      <h2 className="text-xl font-semibold mb-6 flex items-center">
        <span className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center mr-2 text-sm">2</span>
        Verify Extracted Garments
      </h2>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="mb-6 pb-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Image area and overlay */}
            <div className="md:w-1/3 rounded-lg overflow-hidden relative">
              <div style={{ position: "relative", width: "100%", height: "100%", userSelect: "none" }}>
                <img src={selectedImage?.url} alt={selectedImage?.caption || selectedImage?.name} className="w-full object-contain" draggable={false} />
                <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }} />
                <h3 className="font-medium mb-4 mt-4 text-center">Detected Items ({Object.keys(items).length || 0})</h3>
              </div>
            </div>

            {/* Image item details */}
            <div className="md:w-2/3">
              <div className="space-y-4">
                {Object.keys(items).length > 0 ? (
                  Object.values(items).map((it) => (
                    <ItemComponent
                      key={it.id}
                      setItems={updateItem}
                      deleteItem={deleteItem}
                      item={it}
                      setSelectedItem={(sel) => setCurrentItem(sel)}
                      selectedItem={currentItem}
                      selectItem={(sel) => setCurrentItem(sel)}
                      selectedImage={selectedImage}
                    />
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No items detected yet.</div>
                )}

                <button
                  onClick={() => addItem()}
                  className="w-full py-2 border border-gray-300 border-dashed rounded-lg text-sm border-primary-300 bg-primary-600 text-white transition-colors duration-300 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined mr-1">add</span>
                  Add another item
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Submit the draft */}
        <div className="flex justify-between mt-6">
          <button className="text-gray-600 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors duration-300 inline-flex items-center">
            <span className="material-symbols-outlined mr-1">arrow_back</span>
            Back to Upload
          </button>

          <div className="flex items-center gap-3">
            <button className="px-4 py-2 border rounded-md">Update Your Garments</button>

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