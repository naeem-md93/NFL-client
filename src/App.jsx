import { useState, useEffect } from 'react';

import HeaderComponent from "./components/Header/Header.jsx";
import FlowComponent from "./components/Flow/Flow.jsx";
import ImageComponent from "./components/Image/Image.jsx";
import ItemComponent from "./components/Item/Item.jsx";
import RecommendComponent from "./components/Recommend/Recommend.jsx";


const SERVER_URL = import.meta.env.VITE_SERVER_URL;


export default function App() {
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    if (!selectedImageId) return;
    const fetchImage = async () => {
      const resp = await fetch(`${SERVER_URL}/api/closet/images/get-image?id=${selectedImageId}`);
      const data = await resp.json();
      setSelectedImage(data);
    }
    fetchImage();
  }, [selectedImageId]);


  return (
    <>
      <div id="webcrumbs">
        <div className="min-h-screen bg-gray-50">

          <HeaderComponent />

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            <FlowComponent />

            <ImageComponent
              setSelectedImageId={setSelectedImageId}
            />

            { selectedImage && <ItemComponent
              selectedImage={selectedImage}
              selectedImageId={selectedImageId}
              setSelectedImageId={setSelectedImageId}
            />}


            { selectedImage && <RecommendComponent
            />}



            {/*Virtual Try-On*/}
            {/*<section id="virtual-tryon" className="mb-16">*/}
            {/*  <h2 className="text-xl font-semibold mb-6 flex items-center">*/}
            {/*    <span className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center mr-2 text-sm">4</span>*/}
            {/*    Virtual Try-On*/}
            {/*  </h2>*/}

            {/*  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">*/}
            {/*    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">*/}
            {/*      <div className="lg:col-span-2">*/}
            {/*        <div className="mb-3 flex items-center justify-between">*/}
            {/*          <div>*/}
            {/*            <h3 className="font-medium">Try recommendations on your photo</h3>*/}
            {/*            <p className="text-sm text-gray-500">Upload a photo and overlay recommended items. Drag to position, use the handle to resize, and export when ready.</p>*/}
            {/*          </div>*/}
            {/*          <div className="text-sm text-gray-500">*/}
            {/*            Tip: hold <span className="kbd">Shift</span> while dragging handle to scale proportionally*/}
            {/*          </div>*/}
            {/*        </div>*/}

            {/*        <div className="border border-gray-200 rounded-lg overflow-hidden">*/}
            {/*          <div className="p-4 bg-gray-50 flex items-center gap-4">*/}
            {/*            <input id="user-photo-input" type="file" accept="image/*" className="hidden"/>*/}
            {/*            <button id="upload-photo-btn" className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors duration-300 inline-flex items-center">*/}
            {/*              <span className="material-symbols-outlined mr-2">person</span>*/}
            {/*              Upload Your Photo*/}
            {/*            </button>*/}

            {/*            <button id="clear-photo-btn" className="px-3 py-2 border rounded text-sm text-gray-700 hover:bg-gray-50">Clear Photo</button>*/}

            {/*            <div className="ml-auto flex items-center tryon-controls">*/}
            {/*              <button id="export-btn" className="px-4 py-2 bg-indigo-600 text-white rounded">Export PNG</button>*/}
            {/*              <button id="clear-overlays-btn" className="px-3 py-2 border rounded text-sm text-gray-700">Clear Overlays</button>*/}
            {/*            </div>*/}
            {/*          </div>*/}

            {/*          <div className="p-6">*/}
            {/*            <div id="stage-wrapper" className="w-full bg-white border rounded-lg p-4 flex justify-center items-center" style="min-height:420px;">*/}
            {/*              <div id="tryon-stage" className="relative w-full max-w-2xl h-[420px] bg-gray-100 rounded overflow-hidden flex items-center justify-center">*/}
            {/*                <div id="stage-empty" className="text-center text-gray-400">*/}
            {/*                  <div className="material-symbols-outlined text-6xl">photo_camera</div>*/}
            {/*                  <div className="mt-2 text-sm">No photo uploaded</div>*/}
            {/*                </div>*/}
            {/*                <img id="user-photo" src="" alt="User" className="w-full h-full object-contain hidden"/>*/}
            {/*              </div>*/}
            {/*            </div>*/}
            {/*            <div className="mt-3 text-xs text-gray-500">*/}
            {/*              Use the thumbnails on the right to add overlays.*/}
            {/*              Click an overlay to select it, drag to move, drag the bottom-right handle to resize.*/}
            {/*            </div>*/}
            {/*          </div>*/}
            {/*        </div>*/}
            {/*      </div>*/}

            {/*      <div className="border-t lg:border-t-0 lg:border-l border-gray-200 lg:pl-6 pt-6 lg:pt-0">*/}
            {/*        <h3 className="font-medium mb-4">Recommended items</h3>*/}

            {/*        <div id="recs-list" className="grid grid-cols-1 gap-3">*/}
            {/*          <div className="flex items-center gap-3 p-3 border border-gray-100 rounded hover:bg-gray-50 transition">*/}
            {/*            <img src="https://images.unsplash.com/photo-1591047139829-d91aecb6caea" className="w-16 h-16 object-cover rounded" alt="rec1"/>*/}
            {/*            <div className="flex-1">*/}
            {/*              <div className="font-medium text-sm">Blue Denim Jacket</div>*/}
            {/*              <div className="text-xs text-gray-500">Outerwear</div>*/}
            {/*            </div>*/}
            {/*            <button className="add-rec-btn px-3 py-1 bg-primary-50 text-primary-600 rounded text-sm" data-src="https://images.unsplash.com/photo-1591047139829-d91aecb6caea">Add</button>*/}
            {/*          </div>*/}

            {/*          <div className="flex items-center gap-3 p-3 border border-gray-100 rounded hover:bg-gray-50 transition">*/}
            {/*            <img src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8" className="w-16 h-16 object-cover rounded" alt="rec2"/>*/}
            {/*            <div className="flex-1">*/}
            {/*              <div className="font-medium text-sm">Black T-Shirt</div>*/}
            {/*              <div className="text-xs text-gray-500">Top</div>*/}
            {/*            </div>*/}
            {/*            <button className="add-rec-btn px-3 py-1 bg-primary-50 text-primary-600 rounded text-sm" data-src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8">Add</button>*/}
            {/*          </div>*/}

            {/*          <div className="flex items-center gap-3 p-3 border border-gray-100 rounded hover:bg-gray-50 transition">*/}
            {/*            <img src="https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec" className="w-16 h-16 object-cover rounded" alt="rec3"/>*/}
            {/*            <div className="flex-1">*/}
            {/*              <div className="font-medium text-sm">White Sneakers</div>*/}
            {/*              <div className="text-xs text-gray-500">Shoes</div>*/}
            {/*            </div>*/}
            {/*            <button className="add-rec-btn px-3 py-1 bg-primary-50 text-primary-600 rounded text-sm" data-src="https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec">Add</button>*/}
            {/*          </div>*/}

            {/*          <div className="flex items-center gap-3 p-3 border border-gray-100 rounded hover:bg-gray-50 transition">*/}
            {/*            <img src="https://images.unsplash.com/photo-1596755094514-f87e34085b2c" className="w-16 h-16 object-cover rounded" alt="rec4"/>*/}
            {/*            <div className="flex-1">*/}
            {/*              <div className="font-medium text-sm">White T-Shirt</div>*/}
            {/*              <div className="text-xs text-gray-500">Top</div>*/}
            {/*            </div>*/}
            {/*            <button className="add-rec-btn px-3 py-1 bg-primary-50 text-primary-600 rounded text-sm" data-src="https://images.unsplash.com/photo-1596755094514-f87e34085b2c">Add</button>*/}
            {/*          </div>*/}

            {/*          <div className="mt-4">*/}
            {/*            <button id="more-recs" className="w-full px-3 py-2 border rounded text-sm text-gray-700 hover:bg-gray-50">See more</button>*/}
            {/*          </div>*/}
            {/*        </div>*/}
            {/*      </div>*/}
            {/*    </div>*/}
            {/*  </div>*/}
            {/*</section>*/}

            <footer className="mt-12 text-center text-sm text-gray-500">
              Demo — switch simulated extraction and recommendation functions to real backends for production.
            </footer>

          </main>
        </div>
      </div>
    </>
  )
};