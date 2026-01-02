interface EnvironmentErrorProps {
  missingKeys: string[];
}

export default function EnvironmentError({ missingKeys }: EnvironmentErrorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700">
          <div className="flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mx-auto mb-6">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Environment Variables Missing
          </h1>
          
          <p className="text-slate-300 text-center mb-6">
            The application cannot start because required environment variables are not configured.
          </p>
          
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-600 mb-6">
            <h2 className="text-sm font-semibold text-slate-200 mb-2">Missing Variables:</h2>
            <ul className="space-y-1">
              {missingKeys.map((key) => (
                <li key={key} className="text-red-400 text-sm font-mono">
                  {key}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="text-xs text-slate-400 text-center space-y-2">
            <p>Please ensure your .env file contains:</p>
            <div className="bg-slate-900 rounded p-2 font-mono">
              <p>VITE_SUPABASE_URL=your_supabase_url</p>
              <p>VITE_SUPABASE_ANON_KEY=your_supabase_anon_key</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}