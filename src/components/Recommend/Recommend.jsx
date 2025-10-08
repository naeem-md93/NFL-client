import React, { useEffect, useState } from "react";
import { fetchData } from "../utils.js";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;
const ITEMS_URL = `${SERVER_URL}/api/closet/items/`;
const RECOMMENDATION_URL = `${SERVER_URL}/api/closet/recommendations/`;
const DEFAULT_OCCASIONS = ["Casual", "Work", "Date Night", "Formal", "Workout", "Beach", "Party"];


export default function RecommendComponent({ selectedItems, setSelectedItems }) {
  const [items, setItems] = useState([]); // all items fetched from server
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [occasions] = useState(new Set(DEFAULT_OCCASIONS));
  const [selectedOccasions, setSelectedOccasions] = useState(new Set()); // e.g., "Casual","Work",...

  // sources is a Set of source names discovered from items
  const [sources, setSources] = useState(new Set());
  // selectedSources is a Set of currently checked source names
  const [selectedSources, setSelectedSources] = useState(new Set());

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchData("recommendation (useEffect)", ITEMS_URL, { method: "GET" });

        // ensure data is an array
        const list = Array.isArray(data) ? data : [];
        setItems(list);

        // collect sources and default-select them all
        const srcSet = new Set();
        list.forEach((it) => {
          if (it.source) srcSet.add(it.source);
        });
        setSources(srcSet);

        // default: select all sources on first load
        setSelectedSources(new Set(srcSet));
      } catch (err) {
        console.error(err);
        setError("Failed to load items.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  console.log(items)
  console.log(sources);

  function toggleOccasion(name) {
    setSelectedOccasions((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function toggleSource(name) {
    setSelectedSources((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function selectAllSources() {
    setSelectedSources(new Set(sources));
  }

  function clearAllSources() {
    setSelectedSources(new Set());
  }

  function toggleItemSelection(itemId) {
    setSelectedItems((prev) => {
      // prev is expected to be a Set passed in from parent
      const next = new Set(prev || []);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  // Filter items by the selected sources
  const filteredItems = items.filter((it) => selectedSources.size === 0 ? false : selectedSources.has(it.source));

  // Helper: group items by source to render grouped sections
  function groupBySource(list) {
    const groups = {};
    for (const it of list) {
      const src = it.source || "unknown";
      if (!groups[src]) groups[src] = [];
      groups[src].push(it);
    }
    return groups;
  }

  const grouped = groupBySource(filteredItems);

  return (
    <section className="mb-16">
      <h2 className="text-xl font-semibold mb-6 flex items-center">
        <span className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center mr-2 text-sm">3</span>
        Request Outfit Recommendations
      </h2>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / main controls */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Select Base Items for Your Outfit</h3>
              <div className="text-sm text-gray-600">Selected: <span className="font-medium">{selectedItems?.size || 0}</span></div>
            </div>

            {/* Source filter row: checkboxes */}
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-sm font-medium">Sources</div>
                <button onClick={selectAllSources} className="text-xs px-2 py-1 border rounded bg-gray-50">Select all</button>
                <button onClick={clearAllSources} className="text-xs px-2 py-1 border rounded bg-gray-50">Clear</button>
              </div>

              <div className="flex flex-wrap gap-2">
                {[...sources].map((sc) => {
                  const checked = selectedSources.has(sc);
                  // count items per source
                  const count = items.filter((it) => it.source === sc).length;
                  return (
                    <label key={sc} className={`flex items-center p-2 border rounded-md ${checked ? "border-primary-400" : "border-gray-200"} cursor-pointer`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSource(sc)}
                        className="mr-2 h-4 w-4 text-primary-600"
                      />
                      <div className="text-sm">
                        <div className="font-medium">{sc}</div>
                        <div className="text-xs text-gray-500">{count} items</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Items grid (grouped by source) */}
            {loading ? (
              <div className="py-12 text-center text-gray-500">Loading items…</div>
            ) : (
              <>
                {selectedSources.size === 0 ? (
                  <div className="py-8 text-center text-gray-500">No source selected. Choose sources to show items.</div>
                ) : (
                  Object.entries(grouped).map(([src, list]) => (
                    <div key={src} className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{src} <span className="text-xs text-gray-500">({list.length})</span></h4>
                        <div>
                          <button
                            onClick={() => {
                              // quick select all items from this source
                              setSelectedItems((prev) => {
                                const next = new Set(prev || []);
                                list.forEach((it) => next.add(it.id));
                                return next;
                              });
                            }}
                            className="text-xs px-2 py-1 border rounded bg-gray-50 mr-2"
                          >
                            Select all
                          </button>
                          <button
                            onClick={() => {
                              // clear items of this source from selection
                              setSelectedItems((prev) => {
                                const next = new Set(prev || []);
                                list.forEach((it) => next.delete(it.id));
                                return next;
                              });
                            }}
                            className="text-xs px-2 py-1 border rounded bg-gray-50"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {list.map((it) => {
                          const checked = (selectedItems && selectedItems.has(it.id));
                          return (
                            <label
                              key={it.id}
                              className={`border ${checked ? "border-primary-400 shadow-sm" : "border-gray-200"} rounded-lg p-3 transition-shadow duration-200 cursor-pointer relative group`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleItemSelection(it.id)}
                                className="absolute top-2 right-2 h-4 w-4 text-primary-600"
                              />
                              <div className="h-32 bg-gray-100 rounded-md overflow-hidden mb-2">
                                <img src={it.url} alt={it.caption || it.type} className="w-full h-full object-cover" />
                              </div>
                              <div className="text-sm font-medium">{it.caption || `Item ${it.id.slice(0, 6)}`}</div>
                              <div className="text-xs text-gray-500">{it.type} • {it.source}</div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            <h3 className="font-medium mb-2">Describe What You're Looking For</h3>
            <textarea
              placeholder="E.g., 'I need a complete casual outfit for a coffee date this weekend' or 'Looking for pants that go well with this jacket for a business casual look'"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 min-h-[120px] mb-4"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <div className="mb-6">
              <h3 className="font-medium mb-3">Occasion</h3>
              <div className="flex flex-wrap gap-2">
                {[...occasions].map((o) => {
                  const active = selectedOccasions.has(o);
                  return (
                    <button
                      key={o}
                      type="button"
                      onClick={() => toggleOccasion(o)}
                      className={`${active ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-800"} px-3 py-1 rounded-full text-sm font-medium transition`}
                    >
                      {o}
                    </button>
                  );
                })}
                <button
                  onClick={() => {
                    const custom = prompt("Add custom occasion:");
                    if (!custom) return;
                    // add to occasions set — since it's stored as Set in state const, we must update selectedOccasions only
                    setSelectedOccasions((prev) => {
                      const next = new Set(prev);
                      next.add(custom);
                      return next;
                    });
                  }}
                  className="px-3 py-1 rounded-full bg-gray-50 text-gray-500 text-sm font-medium border border-dashed border-gray-300"
                >
                  + Add Custom
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <button
                disabled={loading}
                className={`px-4 py-2 rounded-md text-white ${loading ? "bg-primary-300 cursor-wait" : "bg-primary-600 hover:bg-primary-700"}`}
                onClick={() => {
                  // placeholder: call your recommendation API (not implemented here)
                  alert("Request Recommendation clicked — implement API call.");
                }}
              >
                {loading ? "Requesting..." : "Request Recommendation"}
              </button>

              <button
                onClick={() => {
                  if (!selectedItems || selectedItems.size === 0) {
                    // quick select first item if nothing selected
                    if (items.length > 0) setSelectedItems(new Set([items[0].id]));
                  } else {
                    // clear selection
                    setSelectedItems(new Set());
                  }
                }}
                className="px-3 py-2 border rounded-md text-sm"
              >
                {(!selectedItems || selectedItems.size === 0) ? "Quick Select" : "Clear"}
              </button>

              <button
                onClick={() => {
                  setQuery("Bright sporty matching set for morning run");
                }}
                className="px-3 py-2 border rounded-md text-sm"
              >
                Use Example Query
              </button>
            </div>
          </div>

          {/* Right column: placeholder for advanced options or source summary */}
          <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-gray-200 lg:pl-6 pt-6 lg:pt-0">
            <h3 className="font-medium mb-4">Selected Sources</h3>
            <div className="text-sm text-gray-600 mb-4">
              {selectedSources.size} selected • {Array.from(selectedSources).join(", ")}
            </div>

            <h3 className="font-medium mb-2">Quick Filters</h3>
            <div className="space-y-3 mb-6">
              <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-primary-400 cursor-pointer">
                <input
                  type="radio"
                  name="sourceMode"
                  checked={true}
                  readOnly
                  className="mr-3 h-4 w-4 text-primary-600"
                />
                <div>
                  <div className="font-medium">Show selected sources</div>
                  <div className="text-xs text-gray-500">Only items from checked sources appear</div>
                </div>
              </label>
            </div>

            <div className="text-xs text-gray-500">
              Tip: choose the sources you want recommendations from, then select base items and add an optional query. Click <strong>Request Recommendation</strong> to continue.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
