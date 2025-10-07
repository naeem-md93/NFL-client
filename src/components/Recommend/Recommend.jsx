import React, {useEffect, useState} from "react";


const SERVER_URL = import.meta.env.VITE_SERVER_URL;


export default function RecommendComponent({ closetItems = [], selectedImage = null, onAddToCloset }) {

  const [query, setQuery] = useState("");
  const [occasions, setOccasions] = useState(new Set()); // e.g., "Casual","Work",...

  const [budget, setBudget] = useState("Any budget");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);


  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sources, setSources] = useState(new Set(["closet", "Alibaba", "Amazon", "Digikala"]));
  const [selectedSources, setSelectedSources] = useState(new Set());

  // Fetch
  useEffect(() => {
    const fetchItems = async () => {
      const resp = await fetch(`${SERVER_URL}/api/closet/items/get-items`);
      const data = await resp.json();
      setItems(data);
    }

    const itemData = fetchItems();
  }, [])

  function toggleItem(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleOccasion(name) {
    setOccasions((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function clearSelections() {
    setSelectedIds(new Set());
    setQuery("");
    setOccasions(new Set());
    setResults(null);
    setError("");
  }

  async function requestRecommendations() {
    setError("");
    // basic validation: require either a query or at least one selected item
    if (!query.trim() && selectedIds.size === 0) {
      setError("Please select at least one base item or enter a query describing what you want.");
      return;
    }

    setLoading(true);
    setResults(null);

    const payload = {
      image_id: selectedImage?.id || null,
      selected_item_ids: Array.from(selectedIds),
      query: query.trim(),
      occasions: Array.from(occasions),
      source: source,
      budget: budget,
    };

    try {
      // Replace with your real API endpoint
      const res = await fetch("/api/recommendations/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // try to parse error
        const text = await res.text();
        throw new Error(text || `Request failed ${res.status}`);
      }

      const data = await res.json();
      // Expecting { outfits: [ { score, items: [{id,title,img}], explanation } ] }
      setResults(data);
    } catch (err) {
      // fallback: produce a mock suggestion so the UI remains helpful
      console.error(err);
      const mock = {
        outfits: [
          {
            score: 0.92,
            items: [
              { id: "s2", title: "Black T-Shirt", img: items[1]?.img },
              { id: "p1", title: "Slim Navy Chinos", img: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246" },
            ],
            explanation: "Smart-casual combo: black tee + navy chinos works for many occasions.",
          },
        ],
      };
      setResults(mock);
      setError("Recommendation API failed — showing a mock suggestion. Check server logs.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mb-16">
      <h2 className="text-xl font-semibold mb-6 flex items-center">
        <span className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center mr-2 text-sm">3</span>
        Request Outfit Recommendations
      </h2>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / main */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Select Base Items for Your Outfit</h3>
              <div className="text-sm text-gray-600">Selected: <span className="font-medium">{selectedIds.size}</span></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {items.map((it) => {
                const checked = selectedIds.has(it.id);
                return selectedSources.has(it?.source || "closet") ? (
                  <label key={it.id} className={`border ${checked ? "border-primary-400 shadow-sm" : "border-gray-200"} rounded-lg p-3 transition-shadow duration-200 cursor-pointer relative group`}>
                    <input type="checkbox" checked={checked} onChange={() => toggleItem(it.id)} className="absolute top-2 right-2 h-4 w-4 text-primary-600"/>
                    <div className="h-32 bg-gray-100 rounded-md overflow-hidden mb-2">
                      <img src={it.img} alt={it.caption} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-sm font-medium">{it.caption}</div>
                    <div className="text-xs text-gray-500">{it.type}</div>
                  </label>
                ) : "";
              })}
            </div>

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
                {["Casual", "Work", "Date Night", "Formal", "Workout", "Beach", "Party"].map((o) => {
                  const active = occasions.has(o);
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
                    if (custom) toggleOccasion(custom);
                  }}
                  className="px-3 py-1 rounded-full bg-gray-50 text-gray-500 text-sm font-medium border border-dashed border-gray-300"
                >
                  + Add Custom
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={requestRecommendations}
                disabled={loading}
                className={`px-4 py-2 rounded-md text-white ${loading ? "bg-primary-300 cursor-wait" : "bg-primary-600 hover:bg-primary-700"}`}
              >
                {loading ? "Requesting..." : "Request Recommendation"}
              </button>

              <button
                onClick={() => {
                  // quick heuristic: auto-select top-2 items if none chosen
                  if (selectedIds.size === 0 && items.length > 0) {
                    setSelectedIds(new Set([items[0].id]));
                  } else {
                    clearSelections();
                  }
                }}
                className="px-3 py-2 border rounded-md text-sm"
              >
                {selectedIds.size === 0 ? "Quick Select" : "Clear"}
              </button>

              <button
                onClick={() => {
                  // try a sample query
                  setQuery("Bright sporty matching set for morning run");
                }}
                className="px-3 py-2 border rounded-md text-sm"
              >
                Use Example Query
              </button>

              <div className="ml-auto text-sm text-gray-500">{error && <span className="text-red-500 mr-2">{error}</span>}</div>
            </div>

            {/* Results panel */}
            {results && (
              <div className="mt-4 border-t pt-4">
                <h4 className="font-medium mb-2">Recommendations</h4>
                <div className="space-y-3">
                  {results.outfits?.length ? (
                    results.outfits.map((o, idx) => (
                      <div key={idx} className="p-3 border rounded-lg flex gap-3 items-center">
                        <div className="flex-shrink-0 w-20 grid grid-cols-2 gap-1">
                          {o.items?.slice(0, 2).map((it, i) => (
                            <img key={i} src={it.img || it.image || "https://via.placeholder.com/64"} className="w-full h-10 object-cover rounded" alt={it.title || it.id} />
                          ))}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{o.items?.map((x) => x.title).join(" + ")}</div>
                          <div className="text-xs text-gray-500">{o.explanation || `Score: ${(o.score || 0).toFixed(2)}`}</div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              // accept outfit (example flow) - call onAddToCloset or POST to server
                              if (onAddToCloset) onAddToCloset(o);
                              alert("Added outfit to cart/closet (mock)");
                            }}
                            className="px-3 py-1 bg-primary-600 text-white rounded text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              // open details or view full
                              alert(JSON.stringify(o, null, 2));
                            }}
                            className="px-3 py-1 border rounded text-sm"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No recommendations found.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right column: source & advanced */}
          <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-gray-200 lg:pl-6 pt-6 lg:pt-0">
            <h3 className="font-medium mb-4">Recommendation Source</h3>
            <div className="space-y-3 mb-6">
              <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-primary-400 cursor-pointer">
                <input type="radio" name="source" checked={"my_closet"} onChange={() => setSource("my_closet")} className="mr-3 h-4 w-4 text-primary-600" />
                <div>
                  <div className="font-medium">My Closet</div>
                  <div className="text-xs text-gray-500">Recommend items I already own</div>
                </div>
              </label>
              <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-primary-400 cursor-pointer">
                <input type="radio" name="source" checked={"online"} onChange={() => setSource("online")} className="mr-3 h-4 w-4 text-primary-600" />
                <div>
                  <div className="font-medium">Online Shopping</div>
                  <div className="text-xs text-gray-500">Suggest items I can purchase</div>
                </div>
              </label>
              <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-primary-400 cursor-pointer">
                <input type="checkbox" name="source" checked={"both"} onChange={() => setSource("both")} className="mr-3 h-4 w-4 text-primary-600" />
                <div>
                  <div className="font-medium">Both</div>
                  <div className="text-xs text-gray-500">Mix of owned and new items</div>
                </div>
              </label>
            </div>

            <details className="mb-6">
              <summary className="font-medium cursor-pointer hover:text-primary-600 transition-colors duration-300 flex items-center">
                <span className="material-symbols-outlined mr-1">settings</span>
                Advanced Options
              </summary>
              <div className="mt-3 space-y-4 pl-2">
                <div>
                  <label className="block text-sm mb-1">Budget (for shopping items)</label>
                  <select value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm">
                    <option>Any budget</option>
                    <option>Budget-friendly</option>
                    <option>Mid-range</option>
                    <option>Premium</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-1">Diversity</label>
                  <select className="w-full p-2 border border-gray-300 rounded-md text-sm">
                    <option>Balanced (default)</option>
                    <option>Maximize novelty</option>
                    <option>Prefer similar styles</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-1">Number of suggestions</label>
                  <input type="range" min="1" max="10" defaultValue="3" className="w-full" />
                </div>
              </div>
            </details>

            <div className="text-xs text-gray-500">
              Tip: select the pieces you want the recommender to consider as base items, add a short query (optional), choose occasion and source, then press <strong>Request Recommendation</strong>.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
