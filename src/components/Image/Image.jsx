import {useRef, useState, useEffect} from "react";


const SERVER_URL = import.meta.env.VITE_SERVER_URL;
const IMAGES_URL = `${SERVER_URL}/api/closet/images/`;


export default function ImageComponent({setSelectedImageId}) {

  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      const resp = await fetchImages();
    }
    const resp = fetchData();
  }, [])

  // Requests (API)

  async function fetchImages() {
    setIsLoading(true);
    const res = await fetch(IMAGES_URL, { method: 'GET'});
    const data = await res.json();
    setImages(Array.isArray(data) ? data : []);
    setIsLoading(false);
  }

  async function handleDelete(id, refresh=false) {
    const res = await fetch(IMAGES_URL, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });

    if (refresh) {
      await fetchImages();
    }
  }

  async function clearAll() {
    await Promise.all(images.map((it) => handleDelete(it.id)));
    await fetchImages();
  }

  async function handleCreate(formData, refresh=false) {

    const res = await fetch(IMAGES_URL, {
      method: 'POST',
      body: formData,
    });

    console.log(res.status);
    const text = await res.text(); // or await res.json().catch(()=>null)
    console.log(text);

    if (refresh) {
      await fetchImages();
    }
  }

  async function handleFilesChange(e) {

    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fData = new FormData();
    for (const f of files) fData.append('files', f);

    setIsUploading(true);

    await handleCreate(fData, false);
    await fetchImages(); // refresh canonical list after upload
    setIsUploading(false);
    e.target.value = null; // reset input
  }

  // Functionalities
  function openFilePicker() {
    fileInputRef.current?.click();
  }

  return (
    <section className="mb-16">
      <h2 className="text-xl font-semibold mb-6 flex items-center">
        <span className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center mr-2 text-sm">1</span>
        Add your outfit images
      </h2>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors duration-300">
          <span className="material-symbols-outlined text-5xl text-gray-400 mb-3">cloud_upload</span>
          <h3 className="font-medium mb-2">Drag and drop your clothing images here</h3>
          <p className="text-sm text-gray-500 mb-4">or</p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFilesChange}
          />

          <button onClick={openFilePicker} disabled={isUploading} className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors duration-300 inline-flex items-center">
            <span className="material-symbols-outlined mr-1">add_photo_alternate</span>
            {isUploading ? 'Uploading...' : 'Browse Files'}
          </button>

          <p className="text-xs text-gray-500 mt-4">Supported formats: JPG, PNG, HEIC - Max 10MB per file</p>
        </div>

        <div className="mt-6">
          <div className="flex justify-between mb-4">
            <h3 className="font-medium">Uploaded Images ({images.length})</h3>
            <button onClick={clearAll} className="text-primary-600 text-sm hover:text-primary-800 transition-colors duration-300">Clear All</button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-sm text-gray-500">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            { images.map((it) => (
              <div key={it.id} className="border border-gray-200 rounded-lg overflow-hidden group hover:shadow-md transition-shadow duration-300">
                <div className="relative h-48 bg-gray-100">
                  <img src={it.url} alt={it.name || `item_${it.id}`} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                    <button onClick={() => handleDelete(it.id, true)} className="w-8 h-8 bg-white rounded-full shadow flex items-center justify-center hover:bg-red-50 transition-colors duration-300">
                      <span className="material-symbols-outlined text-red-500">delete</span>
                    </button>
                    <button onClick={() => setSelectedImageId(it.id)} className="w-8 h-8 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-50 transition-colors duration-300">
                      <span className="material-symbols-outlined text-green-500">select_check_box</span>
                    </button>
                  </div>
                </div>

                <div className="p-3">
                 <div className="flex items-center justify-between mb-2">
                  <span className="text-sm p-2 border rounded-md w-full mr-2">{it.name || it.id}</span>
                  <span className="text-xs text-gray-500">{it.size ? `${Math.round(it.size/1024)} KB` : ''}</span>
                 </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
};
