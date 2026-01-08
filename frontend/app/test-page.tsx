"use client";

export default function TestPage() {
  const testFetch = async () => {
    const response = await fetch("http://127.0.0.1:8000/dashboard/");
    const data = await response.json();
    console.log(data);
  };

  return (
    <div className="p-8">
      <button 
        onClick={testFetch}
        className="bg-blue-500 px-4 py-2 rounded"
      >
        Test Fetch
      </button>
    </div>
  );
}