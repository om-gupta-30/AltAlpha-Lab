function ErrorMessage({ message, onRetry }) {
  return (
    <div className="bg-red-900/20 border border-red-800 rounded-xl p-6 text-center">
      {/* Icon */}
      <div className="text-5xl mb-4">⚠️</div>
      
      {/* Title */}
      <h3 className="text-xl font-semibold text-red-400 mb-2">
        Analysis Failed
      </h3>
      
      {/* Message */}
      <p className="text-gray-400 mb-6 max-w-md mx-auto">
        {message}
      </p>
      
      {/* Retry Button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200"
        >
          Try Again
        </button>
      )}
      
      {/* Help text */}
      <p className="text-gray-500 text-sm mt-4">
        Make sure the ticker symbol is valid (e.g., AAPL, MSFT, GOOGL)
      </p>
    </div>
  )
}

export default ErrorMessage
