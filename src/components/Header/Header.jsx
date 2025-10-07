


export default function HeaderComponent() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary-600 flex items-center">
          <span className="material-symbols-outlined mr-2">style</span>
          StyleMate
        </h1>
        <nav>
          <ul className="flex space-x-6">
            <li className="hover:text-primary-600 transition-colors duration-200 font-medium">My Closet</li>
            <li className="hover:text-primary-600 transition-colors duration-200 font-medium">Recommendations</li>
            <li className="hover:text-primary-600 transition-colors duration-200 font-medium">Virtual Try-On</li>
            <li className="hover:text-primary-600 transition-colors duration-200 font-medium">Profile</li>
          </ul>
        </nav>
      </div>
    </header>

  )
};