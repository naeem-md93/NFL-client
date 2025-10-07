
export default function FlowComponent () {
  return (
    <div className="mb-10">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold mb-6">Build Your Perfect Outfit</h2>
        <div className="flex items-center space-x-1 text-sm text-gray-500">
          <span className="material-symbols-outlined text-primary-500">help_outline</span> <span>How it works</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow duration-300">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-primary-600">cloud_upload</span>
          </div>
          <h3 className="font-medium mb-2">Upload Images</h3>
          <p className="text-sm text-gray-500">Add photos of your clothes to your digital closet</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow duration-300">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-primary-600">fact_check</span>
          </div>
          <h3 className="font-medium mb-2">Verify Items</h3>
          <p className="text-sm text-gray-500">Confirm detected garments from your uploads</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow duration-300">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-primary-600">edit_note</span>
          </div>
          <h3 className="font-medium mb-2">Describe Needs</h3>
          <p className="text-sm text-gray-500">Select items and describe what you're looking for</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow duration-300">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-primary-600">recommend</span>
          </div>
          <h3 className="font-medium mb-2">Get Recommendations</h3>
          <p className="text-sm text-gray-500">View AI-powered outfit suggestions</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow duration-300">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-primary-600">checkroom</span>
          </div>
          <h3 className="font-medium mb-2">Virtual Try-On</h3>
          <p className="text-sm text-gray-500">See how recommendations look on you</p>
        </div>
      </div>
    </div>
  )
};