'use client';

interface Library {
  id: number;
  name: string;
}

interface OnboardingFormProps {
  session: {
    internalId: number | null;
  };
  libraries: Library[]; // We now accept the libraries as a prop
}

export default function OnboardingForm({ session, libraries }: OnboardingFormProps) {
  return (
    <div className="max-w-md mx-auto mt-12 p-8 bg-white border border-gray-200 rounded-xl shadow-sm">
      <h1 className="text-2xl font-bold mb-2">Welcome to Librova!</h1>
      <p className="text-gray-600 mb-6 text-sm">
        Please complete your profile to request access to your library's curation tools.
      </p>
      
      <form action="/api/staff/onboarding" method="POST" className="space-y-4">
        <input type="hidden" name="internalId" value={session.internalId || ''} />
        
        <div>
          <label className="block text-sm font-medium text-gray-700">First Name</label>
          <input 
            name="firstName" 
            required 
            className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Last Name</label>
          <input 
            name="lastName" 
            required 
            className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Library Affiliation</label>
          <select 
            name="libraryId" 
            required 
            className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="">-- Select your library --</option>
            {/* Map through the database libraries here! */}
            {libraries.map((lib) => (
              <option key={lib.id} value={lib.id}>
                {lib.name}
              </option>
            ))}
          </select>
        </div>
        
        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Complete Registration
        </button>
      </form>
    </div>
  );
}