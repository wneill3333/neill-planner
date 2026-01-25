/**
 * Neill Planner - Main Application Component
 *
 * A Franklin-Covey methodology based productivity application
 * for task prioritization and daily planning.
 */

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-700 to-amber-600 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-white">Neill Planner</h1>
          <p className="text-amber-100 mt-1">Franklin-Covey Productivity System</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Welcome to Neill Planner</h2>
          <p className="text-gray-600">
            Your personal productivity system based on the A-B-C-D priority methodology. Organize
            your tasks, manage your time, and achieve your goals.
          </p>

          {/* Priority Legend */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <span className="w-4 h-4 rounded bg-red-500"></span>
              <span className="text-sm text-gray-700">A - Vital</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-4 h-4 rounded bg-orange-500"></span>
              <span className="text-sm text-gray-700">B - Important</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-4 h-4 rounded bg-yellow-500"></span>
              <span className="text-sm text-gray-700">C - Optional</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-4 h-4 rounded bg-gray-400"></span>
              <span className="text-sm text-gray-700">D - Delegate</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
