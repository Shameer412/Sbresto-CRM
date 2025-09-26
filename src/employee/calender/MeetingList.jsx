import React from "react";
import { useSelector } from "react-redux";
import { useGetLeadFollowUpsQuery } from "../../features/calender/scheduleApiSlice"; // ✅ fix folder name if needed

export default function LeadFollowUpsFromToken() {
  // 1️⃣ Pull id & role_id directly from Redux auth slice
  const { id: leadId, role_id: userType } = useSelector((state) => state.auth) || {};

  // 2️⃣ Query API (skip until we have both values)
  const { data, isLoading, isError, error } = useGetLeadFollowUpsQuery(
    { leadId, userType },
    { skip: !leadId || !userType }
  );

  if (!leadId || !userType) {
    return <p className="text-center text-red-500">Missing user info</p>;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <span className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-md">
        {error?.data?.message || "Error loading follow-ups"}
      </div>
    );
  }

  const followUps = data?.data?.data || [];
  const user = data?.user;

  return (
    <div className="max-w-5xl mx-auto p-4">
      {user && (
        <div className="flex items-center gap-4 mb-6 bg-gray-100 p-4 rounded-lg">
          <img
            src={user.avatar ? `/storage/${user.avatar}` : "/default-avatar.png"}
            alt={user.name}
            className="w-14 h-14 rounded-full object-cover"
          />
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{user.name}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-gray-200 uppercase text-xs text-gray-700">
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Lead ID</th>
              <th className="px-4 py-2">Note</th>
              <th className="px-4 py-2">Follow Up Date</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {followUps.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">{item.id}</td>
                <td className="px-4 py-2">{item.lead_id}</td>
                <td className="px-4 py-2">{item.note}</td>
                <td className="px-4 py-2">
                  {new Date(item.follow_up_date).toLocaleDateString()}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
            {followUps.length === 0 && (
              <tr>
                <td colSpan="5" className="py-4 text-center text-gray-500 italic">
                  No follow-ups found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
