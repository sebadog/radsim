{/* First Attempt (if completed) */}
{firstAttemptFeedback && (
  <div className="mb-6">
    <h3 className="font-medium text-gray-700 mb-2">First Attempt:</h3>
    <div className="bg-gray-50 p-3 rounded mb-2">
      <p className="italic">{firstAttempt}</p>
    </div>
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
      <div className="flex items-start">
        <MessageSquare className="text-blue-500 mr-2 flex-shrink-0 mt-1" />
        <div>
          <p className="whitespace-pre-line">{firstAttemptFeedback}</p>
          {firstAttemptScore !== null && (
            <p className="mt-2 font-medium text-blue-700">
              Score: {firstAttemptScore}/100
            </p>
          )}
        </div>
      </div>
    </div>
  </div>
)}

{/* Final Feedback */}
{feedback && (
  <div className="mb-6">
    <h3 className="font-medium text-gray-700 mb-2">Final Feedback:</h3>
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
      <div className="flex items-start">
        <MessageSquare className="text-blue-500 mr-2 flex-shrink-0 mt-1" />
        <div>
          <p className="whitespace-pre-line">{feedback}</p>
          {score !== null && (
            <p className="mt-2 font-medium text-blue-700">
              Final Score: {score}/100
            </p>
          )}
        </div>
      </div>
    </div>
  </div>
)}