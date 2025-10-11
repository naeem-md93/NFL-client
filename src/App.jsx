import { useState, useEffect } from 'react';

import HeaderComponent from "./components/Header/Header.jsx";
import FlowComponent from "./components/Flow/Flow.jsx";
import ImageComponent from "./components/Image/Image.jsx";
import ItemsComponent from "./components/Item/Items.jsx";
import RecommendComponent from "./components/Recommend/Recommend.jsx";
import TryOnComponent from "./components/TryOn/TryOn.jsx";
import {fetchData} from "./components/utils.js";


const SERVER_URL = "https://nfl-server-dev.up.railway.app:8000";
const IMAGES_URL = `${SERVER_URL}/api/closet/images/`;
const ITEMS_URL = `${SERVER_URL}/api/closet/items/`;
const RECOMMENDATION_URL = `${SERVER_URL}/api/recommendation/`;
const TRYON_URL = `${SERVER_URL}/api/tryon/`;

console.log(SERVER_URL);

export default function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  // const [selectedItems, setSelectedItems] = useState(new Set());
  // const [selectedOutfit, setSelectedOutfit] = useState(null);

  useEffect(() => {

  }, [])

  return (
    <>
      <div id="webcrumbs">
        <div className="min-h-screen bg-gray-50">

          <HeaderComponent />

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            <FlowComponent />

            <ImageComponent
                IMAGES_URL={IMAGES_URL}
                setSelectedImage={setSelectedImage}
            />


            {/*{ selectedImage && <ItemsComponent*/}
            {/*  selectedImage={selectedImage}*/}
            {/*/>}*/}


            {/*<RecommendComponent*/}
            {/*  selectedItems={selectedItems}*/}
            {/*  setSelectedItems={setSelectedItems}*/}
            {/*  setSelectedOutfit={setSelectedOutfit}*/}
            {/*/>*/}

            {/*{ selectedOutfit && <TryOnComponent*/}
            {/*  selectedOutfit={selectedOutfit}*/}
            {/*/> }*/}

            <footer className="mt-12 text-center text-sm text-gray-500">
              Demo — switch simulated extraction and recommendation functions to real backends for production.
            </footer>

          </main>
        </div>
      </div>
    </>
  )
};