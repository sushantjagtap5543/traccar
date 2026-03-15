import React, { useEffect, useState } from "react";
import { api } from "../api/client";

export default function UsersPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api("/api/users")
      .then(setUsers)
      .catch(err => console.error("Failed to fetch users", err));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>User Management (Admin)</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
        <thead>
          <tr style={{ backgroundColor: "#f8f9fa", textAlign: "left" }}>
            <th style={{ padding: "12px", border: "1px solid #dee2e6" }}>ID</th>
            <th style={{ padding: "12px", border: "1px solid #dee2e6" }}>Name</th>
            <th style={{ padding: "12px", border: "1px solid #dee2e6" }}>Email</th>
            <th style={{ padding: "12px", border: "1px solid #dee2e6" }}>Admin</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td style={{ padding: "12px", border: "1px solid #dee2e6" }}>{user.id}</td>
              <td style={{ padding: "12px", border: "1px solid #dee2e6" }}>{user.name}</td>
              <td style={{ padding: "12px", border: "1px solid #dee2e6" }}>{user.email}</td>
              <td style={{ padding: "12px", border: "1px solid #dee2e6" }}>{user.admin ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
