import { Link } from "react-router-dom";

export default function PropertyGuide() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-700 mb-2">Coming Soon</h1>
        <Link to="/" className="text-blue-500 hover:underline text-sm">← Back to Home</Link>
      </div>
    </div>
  );
}