import React, { useRef, useState, useEffect } from "react";
import {fetchData} from "../utils.js";


const SERVER_URL = import.meta.env.VITE_SERVER_URL;
const TRYON_URL = `${SERVER_URL}/api/tryon/`;

export default function TryOnComponent({ selectedOutfit }) {
  const fileInputRef = useRef(null);
  const imgRef = useRef(null);

  const [userImageUrl, setUserImageUrl] = useState("");
  const [resultImageUrl, setResultImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUserImageUrl(url);
    setResultImageUrl(""); // clear previous result
  }

  async function handleGenerate() {
    if (!userImageUrl || !selectedOutfit) {
      alert("Please upload a photo and select an outfit before generating.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      const file = fileInputRef.current?.files?.[0];
      formData.append("photo", file);
      formData.append("outfit_id", selectedOutfit.id);

      const data = await fetchData(
        "tryon (handleGenerate)",
        TRYON_URL,
        {
          method: "POST",
          body: formData,
      });
      console.log(data.result.result_url);
      setResultImageUrl(SERVER_URL + data.result.result_url);
    } catch (err) {
      console.error(err);
      alert("Failed to generate try-on. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 space-y-6">
      <h2 className="text-2xl font-semibold">Virtual Try-On</h2>

      <div className="border border-dashed border-gray-300 rounded-md p-6 text-center relative hover:border-primary-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileChange}
        />
        {userImageUrl ? (
          <img
            ref={imgRef}
            src={userImageUrl}
            alt="User"
            className="mx-auto max-h-80 object-contain"
          />
        ) : (
          <div className="text-gray-400">
            <div className="text-5xl mb-2">🖼️</div>
            <p>Click or drag to upload your photo</p>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={handleGenerate}
          disabled={loading || !userImageUrl || !selectedOutfit}
          className={`px-6 py-2 rounded-md text-white ${
            loading
              ? "bg-primary-300 cursor-wait"
              : "bg-primary-600 hover:bg-primary-700"
          }`}
        >
          {loading ? "Generating..." : "Generate Try-On"}
        </button>

        {resultImageUrl && (
          <button
            onClick={() => window.open(resultImageUrl, "_blank")}
            className="text-sm text-primary-600 hover:underline"
          >
            Open result in new tab
          </button>
        )}
      </div>

      {resultImageUrl && (
        <div className="mt-4 space-y-2">
          <h3 className="text-lg font-medium">Result Preview</h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <img
              src={resultImageUrl}
              alt="Try-on result"
              className="w-100 object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
